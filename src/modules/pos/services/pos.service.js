const mongoose = require("mongoose");
const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const billRepository = require("../repositories/pos.repository");
const recipeRepository = require("../../recipe/repositories/recipe.repository");
const inventoryRepository = require("../../inventory/repositories/inventory.repository");
const inventoryTransactionRepository = require("../../inventory/repositories/inventoryTransaction.repository");
const customerRepository = require("../../customer/repositories/customer.repository");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const { getIo } = require("../../../sockets");
const { notify, checkSalesMilestone } = require("../../../sockets/notify");
const printService = require("../../print/services/print.service");
const kotRepository = require("../../kot/repositories/kot.repository");
const tableRepository = require("../../table/repositories/table.repository");
const { updateTableStatus } = require("../../table/services/table.service");

const createInvoiceNumber = () =>
  `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const isTransactionUnsupported = (error) =>
  error?.code === 20 ||
  /Transaction numbers are only allowed|replica set member or mongos|transactions are not supported/i.test(
    error?.message || "",
  );

const runWithOptionalTransaction = async (operation) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await operation(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    session.endSession();

    if (!isTransactionUnsupported(error)) throw error;
    return operation(null);
  }
};

const calculateTotals = ({ items, taxRate = 0, discount = 0 }) => {
  const subTotal = items.reduce(
    (sum, item) => sum + Number(item.total || item.price * item.quantity),
    0,
  );
  const taxTotal = Number(((subTotal * Number(taxRate || 0)) / 100).toFixed(2));
  const discountTotal = Number(discount || 0);
  const grandTotal = Number(
    Math.max(subTotal + taxTotal - discountTotal, 0).toFixed(2),
  );
  return { subTotal, taxTotal, discountTotal, grandTotal };
};

const ensureBillEditable = (bill) => {
  if (!bill) throw new AppError("Order not found", httpStatus.NOT_FOUND);
  if (bill.status === "completed" || bill.status === "cancelled") {
    throw new AppError(
      "Cannot modify a completed or cancelled order",
      httpStatus.BAD_REQUEST,
    );
  }
};

const deductRecipeStock = async (items, tenant, session) => {
  for (const item of items) {
    const recipe = await recipeRepository.findOne({
      menuItemId: item.menuItemId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    });
    if (!recipe) continue;

    for (const ingredient of recipe.ingredients) {
      const inventoryItem = await inventoryRepository.findOne({
        _id: ingredient.inventoryItemId,
        restaurantId: tenant.restaurantId,
        branchId: tenant.branchId,
      });
      if (!inventoryItem) {
        throw new AppError(
          "Recipe inventory item not found",
          httpStatus.NOT_FOUND,
        );
      }

      const nextQuantity =
        inventoryItem.stockQuantity - ingredient.quantity * item.quantity;
      if (nextQuantity < 0) {
        throw new AppError(
          `Insufficient stock for ${inventoryItem.materialName}`,
          httpStatus.CONFLICT,
        );
      }

      await inventoryRepository.updateById(
        inventoryItem._id,
        { stockQuantity: nextQuantity },
        session,
      );
      await inventoryTransactionRepository.create(
        {
          restaurantId: tenant.restaurantId,
          branchId: tenant.branchId,
          inventoryItemId: inventoryItem._id,
          type: "usage",
          quantity: -ingredient.quantity * item.quantity,
          previousQuantity: inventoryItem.stockQuantity,
          updatedQuantity: nextQuantity,
          referenceId: item.menuItemId,
          notes: `Auto-deducted for order item ${item.menuItemId}`,
          createdBy: null,
        },
        session,
      );
    }
  }
};

const createBill = async ({ payload, tenant, user }) => {
  try {
    const totals = calculateTotals(payload);
    const paidAmount = (payload.payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    const paymentStatus =
      payload.paymentStatus ||
      (paidAmount >= totals.grandTotal && totals.grandTotal > 0
        ? "paid"
        : "pending");
    const status = payload.status;

    const bill = await runWithOptionalTransaction(async (session) => {
      const bill = await billRepository.create(
        {
          ...payload,
          ...totals,
          billNo: payload.billNo || createInvoiceNumber(),
          restaurantId: tenant?.restaurantId,
          branchId: tenant?.branchId,
          createdBy: user?.id || null,
          paymentStatus,
          status,
        },
        session,
      );

      await deductRecipeStock(payload.items, tenant, session);
      // payload.orderType === "qr" &&
      if (payload.tableId) {
        const kot = await kotRepository.create({
          billId: bill._id,
          restaurantId: tenant?.restaurantId,
          branchId: tenant?.branchId,
          kitchenSection: "Kitchen",
          ...payload,
          status: "pending",
          // Stock was already deducted at bill creation (deductRecipeStock
          // above) — flag it so the KOT flow doesn't deduct a second time.
          stockDeducted: true,
          createdBy: user?.id || null,
          updatedBy: user?.id || null,
          updatedAt: new Date(),
        });
      }

      if (payload.tableId) {
        const table = await updateTableStatus({
          id: payload?.tableId,
          payload: {
            status: status !== "completed" ? "occupied" : "available",
            updatedBy: user?.id || null,
            updatedAt: new Date(),
          },
          tenant,
          user,
        });
      }

      if (payload.customerId) {
        const customer = await customerRepository.findOne({
          _id: payload.customerId,
          restaurantId: tenant.restaurantId,
          branchId: tenant.branchId,
        });
        if (customer) {
          await customerRepository.updateById(
            payload.customerId,
            {
              totalOrders: (customer.totalOrders || 0) + 1,
              loyaltyPoints:
                (customer.loyaltyPoints || 0) +
                Math.floor(totals.grandTotal / 10),
            },
            session,
          );
        }
      }

      return bill;
    });

    const io = getIo();
    if (io) {
      console.log(tenant, "tenant");

      io.to(`branch:${tenant.branchId}`).emit("order:created", {
        billId: bill._id,
        branchId: tenant.branchId,
        status: bill.status,
      });
    }
    console.log("Order created:", bill);

    notify(tenant.branchId, {
      type: "order_created",
      title: `New Order #${bill.billNo}`,
      description: payload.tableId
        ? `Table ${payload.tableName || ""} · ${payload.items.length} items`
        : `${payload.orderType} · ${payload.items.length} items`,
      meta: { billId: bill._id, orderType: payload.orderType },
    });

    if (payload.tableId) {
      const kot = await kotRepository.findOne({ billId: bill._id });
      if (kot) {
        printService.printKot({ kotId: kot._id, tenant }).catch((err) => {
          console.error("Error printing KOT:", err.message);
        });
      }
    }

    return bill;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

const getBill = async ({ id, tenant }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!bill) throw new AppError("Order not found", httpStatus.NOT_FOUND);
  return bill;
};

const listBills = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "grandTotal",
    "subTotal",
    "status",
  ]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.orderType) filter.orderType = query.orderType;
  if (query.customerId) filter.customerId = query.customerId;

  // const [items, total] = await billRepository.paginate({
  //   filter,
  //   sort,
  //   skip,
  //   limit,
  // });
  const [items, total] = await billRepository.paginate({
    filter,
    sort,
    skip,
    limit,
    populate: [
      {
        path: "tableId",
        select: "tableName tableNumber",
      },
    ],
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const STATUS_LABELS = {
  completed: "Completed",
  preparing: "Preparing",
  ready_to_serve: "Ready to Serve",
  pending_payment: "Pending Payment",
  cancelled: "Cancelled",
  held: "Held",
  pending: "Pending",
};

const todayOrders = async ({ body, tenant }) => {
  const targetDate = body?.date ? new Date(body.date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const baseScope = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  const dateRange = { $gte: startOfDay, $lte: endOfDay };

  const [statusAgg, summaryAgg, kotCount, tableStats] = await Promise.all([
    // Order status distribution — join KOTs to derive logical status
    billRepository.model.aggregate([
      { $match: { ...baseScope, createdAt: dateRange } },
      {
        $lookup: {
          from: "kots",
          let: { billId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$billId", "$$billId"] } } },
            { $project: { status: 1, _id: 0 } },
          ],
          as: "_kots",
        },
      },
      {
        $addFields: {
          _kotStatuses: "$_kots.status",
          logicalStatus: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "cancelled"] }, then: "cancelled" },
                { case: { $eq: ["$status", "completed"] }, then: "completed" },
                { case: { $eq: ["$status", "held"] }, then: "held" },
                {
                  case: { $in: ["preparing", "$_kots.status"] },
                  then: "preparing",
                },
                {
                  case: { $in: ["ready", "$_kots.status"] },
                  then: "ready_to_serve",
                },
                {
                  case: { $eq: ["$paymentStatus", "pending"] },
                  then: "pending_payment",
                },
              ],
              default: "pending",
            },
          },
        },
      },
      { $group: { _id: "$logicalStatus", count: { $sum: 1 } } },
    ]),

    // Header stats — total orders and revenue
    billRepository.model.aggregate([
      { $match: { ...baseScope, createdAt: dateRange } },
      {
        $group: {
          _id: null,
          ordersToday: { $sum: 1 },
          todayRevenue: { $sum: "$grandTotal" },
        },
      },
    ]),

    // Kitchen queue — active KOTs today
    kotRepository.model.countDocuments({
      ...baseScope,
      status: { $in: ["pending", "preparing"] },
      createdAt: dateRange,
    }),

    // Tables active vs total
    tableRepository.model.aggregate([
      { $match: baseScope },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          occupied: {
            $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const s = summaryAgg[0] || { ordersToday: 0, todayRevenue: 0 };
  const t = tableStats[0] || { total: 0, occupied: 0 };
  const total = s.ordersToday;

  const orderStatusBreakdown = statusAgg.map(({ _id, count }) => ({
    status: _id,
    label: STATUS_LABELS[_id] || _id,
    count,
    percentage: total > 0 ? Number(((count / total) * 100).toFixed(0)) : 0,
  }));

  return {
    ordersToday: total,
    todayRevenue: Number(s.todayRevenue.toFixed(2)),
    kitchenQueue: kotCount,
    tablesActive: { occupied: t.occupied, total: t.total },
    orderStatusBreakdown,
  };
};

const liveStatus = async ({ tenant }) => {
  const baseScope = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const todayRange = { $gte: startOfDay, $lte: endOfDay };

  const [prepTimeAgg, readyCount, urgentCount, chefEffAgg, diningAgg] =
    await Promise.all([
      // Avg prep time from KOTs that have both timestamps (all time, recent)
      kotRepository.model.aggregate([
        {
          $match: {
            ...baseScope,
            preparationStartedAt: { $ne: null },
            readyAt: { $ne: null },
            createdAt: todayRange,
          },
        },
        {
          $addFields: {
            prepMinutes: {
              $divide: [
                { $subtract: ["$readyAt", "$preparationStartedAt"] },
                60000,
              ],
            },
          },
        },
        { $group: { _id: null, avgPrepTime: { $avg: "$prepMinutes" } } },
      ]),

      // Ready orders — active KOTs currently in "ready" state
      kotRepository.model.countDocuments({
        ...baseScope,
        status: "ready",
      }),

      // Urgent orders — high-priority KOTs still pending or preparing
      kotRepository.model.countDocuments({
        ...baseScope,
        priority: "high",
        status: { $in: ["pending", "preparing"] },
      }),

      // Chef efficiency — served / (served + cancelled) for today
      kotRepository.model.aggregate([
        { $match: { ...baseScope, createdAt: todayRange } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            served: {
              $sum: { $cond: [{ $eq: ["$status", "served"] }, 1, 0] },
            },
          },
        },
      ]),

      // Dining status — table counts grouped by status
      tableRepository.model.aggregate([
        { $match: baseScope },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

  const avgPrepTime = prepTimeAgg[0]
    ? Math.round(prepTimeAgg[0].avgPrepTime)
    : 0;

  const effRow = chefEffAgg[0] || { total: 0, served: 0 };
  const chefEfficiency =
    effRow.total > 0
      ? Number(((effRow.served / effRow.total) * 100).toFixed(0))
      : 0;

  const diningMap = { available: 0, occupied: 0, reserved: 0, cleaning: 0 };
  for (const { _id, count } of diningAgg) {
    if (_id in diningMap) diningMap[_id] = count;
  }

  return {
    kitchenPerformance: {
      avgPrepTime,
      readyOrders: readyCount,
      urgentOrders: urgentCount,
      chefEfficiency,
    },
    diningStatus: diningMap,
  };
};

const updateBill = async ({ id, payload, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  ensureBillEditable(bill);
  return billRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const recalcTotals = (bill) => {
  const items = bill.items || [];
  const totals = calculateTotals({
    items,
    taxRate: bill.taxRate || 0,
    discount: bill.discount || 0,
  });
  bill.subTotal = totals.subTotal;
  bill.taxTotal = totals.taxTotal;
  bill.discountTotal = totals.discountTotal;
  bill.grandTotal = totals.grandTotal;
  return bill;
};

const addBillItem = async ({ id, payload, tenant, user }) => {
  return runWithOptionalTransaction(async (session) => {
    const bill = await billRepository
      .findOne({
        _id: id,
        restaurantId: tenant.restaurantId,
        branchId: tenant.branchId,
      })
      .session(session);
    ensureBillEditable(bill);
    bill.items.push(payload.item);
    Object.assign(bill, recalcTotals(bill));
    bill.updatedBy = user.id;
    await deductRecipeStock([payload.item], tenant, session);
    const updated = await bill.save({ session });
    return updated;
  });
};

const updateBillItemQuantity = async ({
  id,
  itemId,
  payload,
  tenant,
  user,
}) => {
  return runWithOptionalTransaction(async (session) => {
    const bill = await billRepository
      .findOne({
        _id: id,
        restaurantId: tenant.restaurantId,
        branchId: tenant.branchId,
      })
      .session(session);
    ensureBillEditable(bill);
    const item = bill.items.id(itemId);
    if (!item) throw new AppError("Bill item not found", httpStatus.NOT_FOUND);
    const quantityDelta = payload.quantity - item.quantity;
    item.quantity = payload.quantity;
    item.total = Number((item.price * payload.quantity).toFixed(2));
    Object.assign(bill, recalcTotals(bill));
    bill.updatedBy = user.id;
    if (quantityDelta !== 0) {
      await deductRecipeStock(
        [{ menuItemId: item.menuItemId, quantity: quantityDelta }],
        tenant,
        session,
      );
    }
    const updated = await bill.save({ session });
    return updated;
  });
};

const removeBillItem = async ({ id, itemId, tenant, user }) => {
  return runWithOptionalTransaction(async (session) => {
    const bill = await billRepository
      .findOne({
        _id: id,
        restaurantId: tenant.restaurantId,
        branchId: tenant.branchId,
      })
      .session(session);
    ensureBillEditable(bill);
    const item = bill.items.id(itemId);
    if (!item) throw new AppError("Bill item not found", httpStatus.NOT_FOUND);
    await deductRecipeStock(
      [{ menuItemId: item.menuItemId, quantity: -item.quantity }],
      tenant,
      session,
    );
    item.deleteOne();
    Object.assign(bill, recalcTotals(bill));
    bill.updatedBy = user.id;
    const updated = await bill.save({ session });
    return updated;
  });
};

const applyBillDiscount = async ({ id, payload, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  ensureBillEditable(bill);
  bill.discount = payload.discount;
  Object.assign(bill, recalcTotals(bill));
  bill.updatedBy = user.id;
  return bill.save();
};

const recordPayment = async ({ id, payload, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!bill) throw new AppError("Order not found", httpStatus.NOT_FOUND);
  bill.payments = bill.payments || [];
  bill.payments.push({ ...payload, paidAt: new Date() });
  const paidAmount = bill.payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  bill.paymentStatus = paidAmount >= bill.grandTotal ? "paid" : "pending";
  if (bill.paymentStatus === "paid") bill.status = "completed";
  bill.updatedBy = user.id;
  const updatedBill = await bill.save();
  const io = getIo();
  if (io)
    io.to(`branch:${tenant.branchId}`).emit("order:payment:updated", {
      billId: bill._id,
      paymentStatus: updatedBill.paymentStatus,
    });

  if (updatedBill.paymentStatus === "paid") {
    notify(tenant.branchId, {
      type: "payment_received",
      title: "Payment Received",
      description: `Order #${updatedBill.billNo} · ₹${updatedBill.grandTotal}`,
      meta: { billId: updatedBill._id, grandTotal: updatedBill.grandTotal },
    });
  }

  if (updatedBill.status === "completed") {
    notify(tenant.branchId, {
      type: "order_completed",
      title: `Order #${updatedBill.billNo} Completed`,
      description: updatedBill.tableName
        ? `Table ${updatedBill.tableName}`
        : updatedBill.orderType,
      meta: { billId: updatedBill._id },
    });

    printService.printBill({ billId: updatedBill._id, tenant }).catch((err) => {
      console.error("Error printing bill:", err.message);
    });

    // Sales milestone check — compare today's revenue before and after this payment
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [agg] = await billRepository.model.aggregate([
      {
        $match: {
          restaurantId: tenant.restaurantId,
          branchId: tenant.branchId,
          paymentStatus: "paid",
          createdAt: { $gte: startOfDay },
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const currentRevenue = agg?.total || 0;
    checkSalesMilestone(
      tenant.branchId,
      currentRevenue - updatedBill.grandTotal,
      currentRevenue,
    );
  }

  return updatedBill;
};

const holdBill = async ({ id, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  ensureBillEditable(bill);
  bill.status = "held";
  bill.updatedBy = user.id;
  return bill.save();
};

const resumeBill = async ({ id, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!bill) throw new AppError("Order not found", httpStatus.NOT_FOUND);
  if (bill.status !== "held")
    throw new AppError(
      "Only held orders can be resumed",
      httpStatus.BAD_REQUEST,
    );
  bill.status = "open";
  bill.updatedBy = user.id;
  return bill.save();
};

const cancelBill = async ({ id, tenant, user }) => {
  const bill = await billRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  ensureBillEditable(bill);
  bill.status = "cancelled";
  bill.updatedBy = user.id;
  const saved = await bill.save();
  notify(tenant.branchId, {
    type: "order_cancelled",
    title: `Order #${bill.billNo} Cancelled`,
    description: bill.tableName ? `Table ${bill.tableName}` : bill.orderType,
    meta: { billId: bill._id },
  });
  return saved;
};

const generateInvoice = async ({ id, tenant }) => {
  const bill = await getBill({ id, tenant });
  return {
    invoiceNumber: bill.billNo,
    bill,
    issuedAt: bill.createdAt,
    dueAmount: bill.grandTotal,
    paymentStatus: bill.paymentStatus,
  };
};

module.exports = {
  createBill,
  getBill,
  listBills,
  updateBill,
  addBillItem,
  updateBillItemQuantity,
  removeBillItem,
  applyBillDiscount,
  recordPayment,
  holdBill,
  resumeBill,
  cancelBill,
  generateInvoice,
  todayOrders,
  liveStatus,
};
