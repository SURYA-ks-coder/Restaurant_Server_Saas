const mongoose = require("mongoose");
const Bill = require("../../pos/models/Bill.model");
const Expense = require("../../expense/models/Expense.model");
const Kot = require("../../kot/models/Kot.model");
const Customer = require("../../customer/Customer.model");
const User = require("../../auth/models/User.model");
const InventoryItem = require("../../inventory/models/InventoryItem.model");
const InventoryTransaction = require("../../inventory/models/InventoryTransaction.model");
const Supplier = require("../../supplier/models/supplier.model");
const DiningTable = require("../../table/models/DiningTable.model");
const QrOrder = require("../../qrOrder/QrOrder.model");
const Department = require("../../department/models/Department.model");
const Shift = require("../../shift/models/Shift.model");
const {
  parsePagination,
  paginationMeta,
} = require("../../../helpers/queryBuilder");

const buildFilter = ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

const dailySales = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalSales: { $sum: "$grandTotal" },
        totalTaxes: { $sum: "$taxTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const monthlySales = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        totalSales: { $sum: "$grandTotal" },
        totalTaxes: { $sum: "$taxTotal" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

const expenseReport = async ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }

  return Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$expenseDate" } },
        totalExpense: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const profitReport = async ({ query, tenant }) => {
  const [sales] = await Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$grandTotal" },
        totalCost: { $sum: "$subTotal" },
        totalTax: { $sum: "$taxTotal" },
      },
    },
  ]);
  const expenseFilter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    expenseFilter.expenseDate = {};
    if (query.startDate) expenseFilter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) expenseFilter.expenseDate.$lte = new Date(query.endDate);
  }
  const [expense] = await Expense.aggregate([
    { $match: expenseFilter },
    { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
  ]);
  return {
    totalSales: sales?.totalSales || 0,
    totalCost: sales?.totalCost || 0,
    totalTax: sales?.totalTax || 0,
    totalExpense: expense?.totalExpense || 0,
    grossProfit: Number(((sales?.totalSales || 0) - (sales?.totalCost || 0)).toFixed(2)),
    netProfit: Number((
      (sales?.totalSales || 0) -
        (sales?.totalCost || 0) -
        (expense?.totalExpense || 0)
    ).toFixed(2)),
  };
};

const itemSales = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.total" },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
};

const taxReport = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalTax: { $sum: "$taxTotal" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const kotReport = async ({ query, tenant }) => {
  return Kot.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

const dashboardSummary = async ({ query, tenant }) => {
  const billFilter = buildFilter({ query, tenant });
  const expenseFilter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.startDate || query.endDate) {
    expenseFilter.expenseDate = {};
    if (query.startDate) expenseFilter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) expenseFilter.expenseDate.$lte = new Date(query.endDate);
  }

  const [sales] = await Bill.aggregate([
    { $match: billFilter },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$grandTotal" },
        tax: { $sum: "$taxTotal" },
        discounts: { $sum: "$discountTotal" },
        orders: { $sum: 1 },
      },
    },
  ]);
  const [expenses] = await Expense.aggregate([
    { $match: expenseFilter },
    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const revenue = sales?.revenue || 0;
  const expenseTotal = expenses?.total || 0;
  return {
    revenue,
    tax: sales?.tax || 0,
    discounts: sales?.discounts || 0,
    orderCount: sales?.orders || 0,
    averageOrderValue: sales?.orders ? Number((revenue / sales.orders).toFixed(2)) : 0,
    expenses: expenseTotal,
    expenseCount: expenses?.count || 0,
    profit: Number((revenue - expenseTotal).toFixed(2)),
  };
};

const topSellingItems = async ({ query, tenant }) => {
  const limit = Number(query.limit || 10);
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        label: { $first: "$items.itemName" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.total" },
      },
    },
    { $sort: { quantity: -1, revenue: -1 } },
    { $limit: limit },
  ]);
};

const peakHours = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
      },
    },
    { $project: { _id: 0, hour: "$_id", orders: 1, revenue: 1 } },
    { $sort: { hour: 1 } },
  ]);
};

const revenueAnalytics = async ({ query, tenant }) => {
  return Bill.aggregate([
    { $match: buildFilter({ query, tenant }) },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$grandTotal" },
        orders: { $sum: 1 },
      },
    },
    { $project: { _id: 0, label: "$_id", revenue: 1, orders: 1 } },
    { $sort: { label: 1 } },
  ]);
};

const expenseAnalytics = async ({ query, tenant }) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    status: { $ne: "cancelled" },
  };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }
  return Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$category",
        amount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, label: "$_id", amount: 1, count: 1 } },
    { $sort: { amount: -1 } },
  ]);
};

// ── helpers for new reports ───────────────────────────────────────────────────
const _toObjId = (id) => new mongoose.Types.ObjectId(id);

const _reportFilter = ({ query, tenant }) => {
  const filter = { restaurantId: tenant.restaurantId };
  filter.branchId = query.branchId ? _toObjId(query.branchId) : tenant.branchId;
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

// ── Sales Report ──────────────────────────────────────────────────────────────
const salesReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = _reportFilter({ query, tenant });

  const [summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
        },
      },
    ]),
    Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    totalTax: 0,
    totalDiscount: 0,
  };

  return {
    totalRevenue: s.totalRevenue,
    totalOrders: s.totalOrders,
    totalTax: s.totalTax,
    totalDiscount: s.totalDiscount,
    averageOrderValue:
      s.totalOrders > 0 ? Number((s.totalRevenue / s.totalOrders).toFixed(2)) : 0,
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      grandTotal: r.grandTotal,
      subTotal: r.subTotal,
      taxTotal: r.taxTotal,
      discountTotal: r.discountTotal,
      paymentStatus: r.paymentStatus,
      status: r.status,
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Orders Report ─────────────────────────────────────────────────────────────
const ordersReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = _reportFilter({ query, tenant });
  if (query.status) filter.status = query.status;

  const [summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: _reportFilter({ query, tenant }) },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Bill.countDocuments(filter),
  ]);

  const statusMap = Object.fromEntries(summaryAgg.map((a) => [a._id, a.count]));
  const totalAll = Object.values(statusMap).reduce((s, v) => s + v, 0);

  return {
    totalOrders: totalAll,
    completedOrders: statusMap.completed || 0,
    cancelledOrders: statusMap.cancelled || 0,
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      tableId: r.tableId,
      grandTotal: r.grandTotal,
      status: r.status,
      paymentStatus: r.paymentStatus,
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Top Selling Items Report ──────────────────────────────────────────────────
const topSellingItemsReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ..._reportFilter({ query, tenant }), status: { $ne: "cancelled" } };

  const agg = await Bill.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.total" },
      },
    },
    { $sort: { quantitySold: -1, revenueGenerated: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        itemId: "$_id",
        itemName: 1,
        quantitySold: 1,
        revenueGenerated: 1,
      },
    },
  ]);

  return agg;
};

// ── Least Selling Items Report ────────────────────────────────────────────────
const leastSellingItemsReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { ..._reportFilter({ query, tenant }), status: { $ne: "cancelled" } };

  return Bill.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.total" },
      },
    },
    { $sort: { quantitySold: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        itemId: "$_id",
        itemName: 1,
        quantitySold: 1,
      },
    },
  ]);
};

// ── Staff Performance Report ──────────────────────────────────────────────────
const staffPerformanceReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {
    ..._reportFilter({ query, tenant }),
    status: "completed",
  };

  return Bill.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$createdBy",
        ordersHandled: { $sum: 1 },
        salesAmount: { $sum: "$grandTotal" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "_staff",
      },
    },
    { $unwind: { path: "$_staff", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        staffId: "$_id",
        staffName: { $ifNull: ["$_staff.name", "Unknown"] },
        ordersHandled: 1,
        salesAmount: 1,
        averageOrderValue: {
          $cond: [
            { $gt: ["$ordersHandled", 0] },
            { $round: [{ $divide: ["$salesAmount", "$ordersHandled"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { salesAmount: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
};

// ── Customer Report ───────────────────────────────────────────────────────────
const customersReport = async ({ query, tenant }) => {
  const base = { restaurantId: tenant.restaurantId, branchId: tenant.branchId };
  const dateFilter = {};
  if (query.startDate) dateFilter.$gte = new Date(query.startDate);
  if (query.endDate) dateFilter.$lte = new Date(query.endDate);
  const hasDate = Object.keys(dateFilter).length > 0;

  const [total, newCustomers, repeat, topCustomers] = await Promise.all([
    Customer.countDocuments(base),
    Customer.countDocuments({
      ...base,
      ...(hasDate ? { createdAt: dateFilter } : {}),
    }),
    Customer.countDocuments({ ...base, totalOrders: { $gt: 1 } }),
    Customer.find(base)
      .sort({ totalOrders: -1, loyaltyPoints: -1 })
      .limit(10)
      .select("customerName mobileNumber totalOrders loyaltyPoints")
      .lean(),
  ]);

  return {
    totalCustomers: total,
    newCustomers,
    repeatCustomers: repeat,
    topCustomers: topCustomers.map((c) => ({
      customerId: c._id,
      customerName: c.customerName,
      mobileNumber: c.mobileNumber,
      totalOrders: c.totalOrders,
      loyaltyPoints: c.loyaltyPoints,
    })),
  };
};

// ── Tax Report (detailed) ─────────────────────────────────────────────────────
const taxDetailReport = async ({ query, tenant }) => {
  const filter = _reportFilter({ query, tenant });

  const [agg] = await Bill.aggregate([
    { $match: { ...filter, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: null,
        totalTaxCollected: { $sum: "$taxTotal" },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$grandTotal" },
      },
    },
  ]);

  const total = agg?.totalTaxCollected || 0;

  return {
    totalTaxCollected: total,
    cgst: Number((total / 2).toFixed(2)),
    sgst: Number((total / 2).toFixed(2)),
    serviceTax: 0,
    totalOrders: agg?.totalOrders || 0,
    totalRevenue: agg?.totalRevenue || 0,
  };
};

// ── Branch Report ─────────────────────────────────────────────────────────────
const branchesReport = async ({ query, tenant }) => {
  const dateFilter = {};
  if (query.startDate) dateFilter.$gte = new Date(query.startDate);
  if (query.endDate) dateFilter.$lte = new Date(query.endDate);
  const hasDate = Object.keys(dateFilter).length > 0;

  return Bill.aggregate([
    {
      $match: {
        restaurantId: tenant.restaurantId,
        status: { $ne: "cancelled" },
        ...(hasDate ? { createdAt: dateFilter } : {}),
      },
    },
    {
      $group: {
        _id: "$branchId",
        totalRevenue: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
        totalTax: { $sum: "$taxTotal" },
        totalDiscount: { $sum: "$discountTotal" },
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "_id",
        foreignField: "_id",
        as: "_branch",
      },
    },
    { $unwind: { path: "$_branch", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        branchId: "$_id",
        branchName: { $ifNull: ["$_branch.branchName", "Unknown"] },
        totalRevenue: 1,
        totalOrders: 1,
        totalTax: 1,
        totalDiscount: 1,
        averageOrderValue: {
          $cond: [
            { $gt: ["$totalOrders", 0] },
            { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2] },
            0,
          ],
        },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
const auditLogsReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = _reportFilter({ query, tenant });

  const [records, total] = await Promise.all([
    Bill.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email role")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  return {
    records: records.map((b) => ({
      user: b.createdBy?.name || "Unknown",
      role: b.createdBy?.role || "-",
      action: `bill_${b.status}`,
      module: "POS",
      detail: `Bill #${b.billNo} — ${b.orderType} — ₹${b.grandTotal}`,
      timestamp: b.updatedAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Inventory Report ──────────────────────────────────────────────────────────
const inventoryReport = async ({ query, tenant }) => {
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: query.branchId ? _toObjId(query.branchId) : tenant.branchId,
  };
  const txFilter = { ...base };
  if (query.startDate || query.endDate) {
    txFilter.createdAt = {};
    if (query.startDate) txFilter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) txFilter.createdAt.$lte = new Date(query.endDate);
  }

  const [summaryAgg, lowStockItems, categoryBreakdown, recentTransactions] = await Promise.all([
    InventoryItem.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          activeItems: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stockQuantity", 0] }, 1, 0] } },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$minimumStock", 0] },
                    { $lte: ["$stockQuantity", "$minimumStock"] },
                    { $gt: ["$stockQuantity", 0] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    InventoryItem.find({
      ...base,
      status: "active",
      $expr: {
        $and: [{ $gt: ["$minimumStock", 0] }, { $lte: ["$stockQuantity", "$minimumStock"] }],
      },
    })
      .sort({ stockQuantity: 1 })
      .limit(20)
      .select("materialName category unit stockQuantity minimumStock purchasePrice")
      .lean(),
    InventoryItem.aggregate([
      { $match: base },
      {
        $group: {
          _id: "$category",
          itemCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
          totalStock: { $sum: "$stockQuantity" },
        },
      },
      {
        $project: {
          _id: 0,
          category: { $ifNull: ["$_id", "Uncategorised"] },
          itemCount: 1,
          totalValue: { $round: ["$totalValue", 2] },
          totalStock: 1,
        },
      },
      { $sort: { totalValue: -1 } },
    ]),
    InventoryTransaction.find(txFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("inventoryItemId", "materialName unit")
      .populate("createdBy", "name")
      .lean(),
  ]);

  const s = summaryAgg[0] || {
    totalItems: 0,
    activeItems: 0,
    totalValue: 0,
    outOfStock: 0,
    lowStockCount: 0,
  };

  return {
    summary: {
      totalItems: s.totalItems,
      activeItems: s.activeItems,
      totalInventoryValue: Number((s.totalValue || 0).toFixed(2)),
      outOfStockItems: s.outOfStock,
      lowStockItems: s.lowStockCount,
    },
    lowStockAlerts: lowStockItems.map((item) => ({
      itemId: item._id,
      materialName: item.materialName,
      category: item.category || "Uncategorised",
      unit: item.unit,
      currentStock: item.stockQuantity,
      minimumStock: item.minimumStock,
      purchasePrice: item.purchasePrice,
    })),
    categoryBreakdown,
    recentTransactions: recentTransactions.map((t) => ({
      transactionId: t._id,
      itemName: t.inventoryItemId?.materialName || "Unknown",
      unit: t.inventoryItemId?.unit || "",
      type: t.type,
      quantity: t.quantity,
      previousQuantity: t.previousQuantity,
      updatedQuantity: t.updatedQuantity,
      notes: t.notes || null,
      createdBy: t.createdBy?.name || "Unknown",
      createdAt: t.createdAt,
    })),
  };
};

// ── Expenses Detail Report ────────────────────────────────────────────────────
const expensesDetailReport = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: query.branchId ? _toObjId(query.branchId) : tenant.branchId,
    isDeleted: false,
  };
  const filter = { ...base };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }
  if (query.category) filter.category = query.category;
  if (query.paymentMode) filter.paymentMode = query.paymentMode;

  const [summaryAgg, byCategory, byPaymentMode, records, total] = await Promise.all([
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, category: "$_id", amount: 1, count: 1 } },
      { $sort: { amount: -1 } },
    ]),
    Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentMode",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, paymentMode: "$_id", amount: 1, count: 1 } },
      { $sort: { amount: -1 } },
    ]),
    Expense.find(filter)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    Expense.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalAmount: 0, count: 0 };

  return {
    totalAmount: s.totalAmount,
    totalCount: s.count,
    byCategory,
    byPaymentMode,
    records: records.map((e) => ({
      expenseId: e._id,
      expenseName: e.expenseName,
      category: e.category,
      amount: e.amount,
      expenseDate: e.expenseDate,
      paymentMode: e.paymentMode,
      notes: e.notes || null,
      createdBy: e.createdBy?.name || "Unknown",
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Profit & Loss Report ──────────────────────────────────────────────────────
const profitLossReport = async ({ query, tenant }) => {
  const billFilter = _reportFilter({ query, tenant });
  const expenseBase = {
    restaurantId: tenant.restaurantId,
    branchId: query.branchId ? _toObjId(query.branchId) : tenant.branchId,
    isDeleted: false,
  };
  const expenseFilter = { ...expenseBase };
  if (query.startDate || query.endDate) {
    expenseFilter.expenseDate = {};
    if (query.startDate) expenseFilter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) expenseFilter.expenseDate.$lte = new Date(query.endDate);
  }

  const activeBillFilter = { ...billFilter, status: { $ne: "cancelled" } };

  const [salesAgg, expenseAgg, monthlySales, monthlyExpenses] = await Promise.all([
    Bill.aggregate([
      { $match: activeBillFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalCOGS: { $sum: "$subTotal" },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Bill.aggregate([
      { $match: activeBillFilter },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
          cogs: { $sum: "$subTotal" },
          tax: { $sum: "$taxTotal" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: { year: { $year: "$expenseDate" }, month: { $month: "$expenseDate" } },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const s = salesAgg[0] || {
    totalRevenue: 0,
    totalCOGS: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalOrders: 0,
  };
  const e = expenseAgg[0] || { totalExpenses: 0, count: 0 };
  const grossProfit = Number((s.totalRevenue - s.totalCOGS).toFixed(2));
  const netProfit = Number((grossProfit - e.totalExpenses).toFixed(2));

  const expenseMap = {};
  monthlyExpenses.forEach((row) => {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    expenseMap[key] = row.expenses;
  });

  const periodBreakdown = monthlySales.map((row) => {
    const key = `${row._id.year}-${String(row._id.month).padStart(2, "0")}`;
    const exp = expenseMap[key] || 0;
    const gross = Number((row.revenue - row.cogs).toFixed(2));
    return {
      period: key,
      revenue: row.revenue,
      cogs: row.cogs,
      grossProfit: gross,
      expenses: exp,
      netProfit: Number((gross - exp).toFixed(2)),
      tax: row.tax,
      orders: row.orders,
    };
  });

  return {
    summary: {
      totalRevenue: s.totalRevenue,
      totalCOGS: s.totalCOGS,
      grossProfit,
      totalExpenses: e.totalExpenses,
      netProfit,
      totalTax: s.totalTax,
      totalDiscount: s.totalDiscount,
      totalOrders: s.totalOrders,
      grossMargin:
        s.totalRevenue > 0
          ? Number(((grossProfit / s.totalRevenue) * 100).toFixed(2))
          : 0,
      netMargin:
        s.totalRevenue > 0
          ? Number(((netProfit / s.totalRevenue) * 100).toFixed(2))
          : 0,
    },
    periodBreakdown,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST-BASED REPORT SERVICES (body params instead of query params)
// ═══════════════════════════════════════════════════════════════════════════════

const _bodyFilter = ({ body, tenant }) => {
  const filter = { restaurantId: tenant.restaurantId };
  filter.branchId = body.branchId ? _toObjId(body.branchId) : tenant.branchId;
  if (body.startDate || body.endDate) {
    filter.createdAt = {};
    if (body.startDate) filter.createdAt.$gte = new Date(body.startDate);
    if (body.endDate) filter.createdAt.$lte = new Date(body.endDate);
  }
  return filter;
};

const _groupFormat = (groupBy) => {
  if (groupBy === "week") return "%Y-%U";
  if (groupBy === "month") return "%Y-%m";
  return "%Y-%m-%d";
};

// ── Sales Reports ─────────────────────────────────────────────────────────────

const salesReportPost = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = _bodyFilter({ body, tenant });
  if (body.orderType) filter.orderType = body.orderType;

  const [summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: { ...filter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
        },
      },
    ]),
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name role")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalRevenue: 0, totalOrders: 0, totalTax: 0, totalDiscount: 0 };
  return {
    summary: {
      totalRevenue: s.totalRevenue,
      totalOrders: s.totalOrders,
      totalTax: s.totalTax,
      totalDiscount: s.totalDiscount,
      averageOrderValue:
        s.totalOrders > 0 ? Number((s.totalRevenue / s.totalOrders).toFixed(2)) : 0,
    },
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      tableName: r.tableName || null,
      grandTotal: r.grandTotal,
      subTotal: r.subTotal,
      taxTotal: r.taxTotal,
      discountTotal: r.discountTotal,
      itemCount: r.items?.length || 0,
      paymentStatus: r.paymentStatus,
      status: r.status,
      createdBy: r.createdBy?.name || "Unknown",
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const salesSummaryReport = async ({ body, tenant }) => {
  const filter = _bodyFilter({ body, tenant });
  const fmt = _groupFormat(body.groupBy);

  const [byPeriod, byOrderType, byPaymentMethod] = await Promise.all([
    Bill.aggregate([
      { $match: { ...filter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: "$createdAt" } },
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          totalRevenue: 1,
          totalOrders: 1,
          totalTax: 1,
          totalDiscount: 1,
          averageOrderValue: {
            $cond: [
              { $gt: ["$totalOrders", 0] },
              { $round: [{ $divide: ["$totalRevenue", "$totalOrders"] }, 2] },
              0,
            ],
          },
        },
      },
      { $sort: { period: 1 } },
    ]),
    Bill.aggregate([
      { $match: { ...filter, status: { $ne: "cancelled" } } },
      {
        $group: { _id: "$orderType", count: { $sum: 1 }, revenue: { $sum: "$grandTotal" } },
      },
      { $project: { _id: 0, orderType: "$_id", count: 1, revenue: 1 } },
    ]),
    Bill.aggregate([
      { $match: { ...filter, status: "completed" } },
      { $unwind: "$payments" },
      {
        $group: {
          _id: "$payments.method",
          totalAmount: { $sum: "$payments.amount" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, method: "$_id", totalAmount: 1, count: 1 } },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);

  const overall = byPeriod.reduce(
    (acc, r) => ({
      totalRevenue: acc.totalRevenue + r.totalRevenue,
      totalOrders: acc.totalOrders + r.totalOrders,
      totalTax: acc.totalTax + r.totalTax,
      totalDiscount: acc.totalDiscount + r.totalDiscount,
    }),
    { totalRevenue: 0, totalOrders: 0, totalTax: 0, totalDiscount: 0 },
  );

  return {
    summary: {
      ...overall,
      averageOrderValue:
        overall.totalOrders > 0
          ? Number((overall.totalRevenue / overall.totalOrders).toFixed(2))
          : 0,
    },
    byPeriod,
    byOrderType,
    byPaymentMethod,
  };
};

const revenueReport = async ({ body, tenant }) => {
  const filter = _bodyFilter({ body, tenant });
  const fmt = _groupFormat(body.groupBy);

  const [summary, trend] = await Promise.all([
    Bill.aggregate([
      { $match: { ...filter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
          maxOrderValue: { $max: "$grandTotal" },
          minOrderValue: { $min: "$grandTotal" },
        },
      },
    ]),
    Bill.aggregate([
      { $match: { ...filter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
          orders: { $sum: 1 },
          tax: { $sum: "$taxTotal" },
          discount: { $sum: "$discountTotal" },
        },
      },
      { $project: { _id: 0, period: "$_id", revenue: 1, orders: 1, tax: 1, discount: 1 } },
      { $sort: { period: 1 } },
    ]),
  ]);

  const s = summary[0] || {
    totalRevenue: 0,
    totalOrders: 0,
    totalTax: 0,
    totalDiscount: 0,
    maxOrderValue: 0,
    minOrderValue: 0,
  };
  return {
    summary: {
      ...s,
      averageOrderValue:
        s.totalOrders > 0 ? Number((s.totalRevenue / s.totalOrders).toFixed(2)) : 0,
    },
    trend,
  };
};

const hourlySalesReport = async ({ body, tenant }) => {
  const filter = _bodyFilter({ body, tenant });
  if (body.date && !body.startDate && !body.endDate) {
    const d = new Date(body.date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.createdAt = { $gte: d, $lt: next };
  }

  const rows = await Bill.aggregate([
    { $match: { ...filter, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { $hour: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$grandTotal" },
        avgOrderValue: { $avg: "$grandTotal" },
      },
    },
    {
      $project: {
        _id: 0,
        hour: "$_id",
        orders: 1,
        revenue: 1,
        avgOrderValue: { $round: ["$avgOrderValue", 2] },
      },
    },
    { $sort: { hour: 1 } },
  ]);

  const hourMap = Object.fromEntries(rows.map((r) => [r.hour, r]));
  const hours = Array.from({ length: 24 }, (_, h) =>
    hourMap[h] || { hour: h, orders: 0, revenue: 0, avgOrderValue: 0 },
  );
  return { hours };
};

const topItemsReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = { ..._bodyFilter({ body, tenant }), status: { $ne: "cancelled" } };

  const rows = await Bill.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItemId",
        itemName: { $first: "$items.itemName" },
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.total" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { quantitySold: -1, revenueGenerated: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        itemId: "$_id",
        itemName: 1,
        quantitySold: 1,
        revenueGenerated: 1,
        orderCount: 1,
      },
    },
  ]);
  return { records: rows, meta: paginationMeta({ total: rows.length + skip, page, limit }) };
};

const salesByCategoryReport = async ({ body, tenant }) => {
  const filter = { ..._bodyFilter({ body, tenant }), status: { $ne: "cancelled" } };

  const rows = await Bill.aggregate([
    { $match: filter },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "menuitems",
        localField: "items.menuItemId",
        foreignField: "_id",
        as: "_item",
      },
    },
    { $unwind: { path: "$_item", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "categories",
        localField: "_item.categoryId",
        foreignField: "_id",
        as: "_cat",
      },
    },
    { $unwind: { path: "$_cat", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$_cat._id", "uncategorised"] },
        categoryName: { $first: { $ifNull: ["$_cat.categoryName", "Uncategorised"] } },
        quantitySold: { $sum: "$items.quantity" },
        revenueGenerated: { $sum: "$items.total" },
        uniqueItems: { $addToSet: "$items.menuItemId" },
      },
    },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        categoryName: 1,
        quantitySold: 1,
        revenueGenerated: 1,
        uniqueItemCount: { $size: "$uniqueItems" },
      },
    },
    { $sort: { revenueGenerated: -1 } },
  ]);
  return { records: rows };
};

// ── Inventory Reports ─────────────────────────────────────────────────────────

const inventoryStockReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
  };

  const [summaryAgg, records, total] = await Promise.all([
    InventoryItem.aggregate([
      { $match: base },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          activeItems: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
          outOfStock: { $sum: { $cond: [{ $eq: ["$stockQuantity", 0] }, 1, 0] } },
        },
      },
    ]),
    InventoryItem.find(base).sort({ materialName: 1 }).skip(skip).limit(limit).lean(),
    InventoryItem.countDocuments(base),
  ]);

  const s = summaryAgg[0] || { totalItems: 0, activeItems: 0, totalValue: 0, outOfStock: 0 };
  return {
    summary: {
      totalItems: s.totalItems,
      activeItems: s.activeItems,
      totalInventoryValue: Number((s.totalValue || 0).toFixed(2)),
      outOfStockItems: s.outOfStock,
    },
    records: records.map((i) => ({
      itemId: i._id,
      materialName: i.materialName,
      category: i.category || "Uncategorised",
      unit: i.unit,
      stockQuantity: i.stockQuantity,
      minimumStock: i.minimumStock,
      purchasePrice: i.purchasePrice,
      stockValue: Number((i.stockQuantity * i.purchasePrice).toFixed(2)),
      status: i.status,
      isLowStock: i.minimumStock > 0 && i.stockQuantity <= i.minimumStock,
      supplier: i.supplier || null,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const lowStockReport = async ({ body, tenant }) => {
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
    status: "active",
    $expr: {
      $and: [{ $gt: ["$minimumStock", 0] }, { $lte: ["$stockQuantity", "$minimumStock"] }],
    },
  };

  const records = await InventoryItem.find(base).sort({ stockQuantity: 1 }).lean();
  return {
    totalLowStock: records.length,
    outOfStock: records.filter((r) => r.stockQuantity === 0).length,
    records: records.map((i) => ({
      itemId: i._id,
      materialName: i.materialName,
      category: i.category || "Uncategorised",
      unit: i.unit,
      currentStock: i.stockQuantity,
      minimumStock: i.minimumStock,
      shortage: Number((i.minimumStock - i.stockQuantity).toFixed(2)),
      purchasePrice: i.purchasePrice,
      estimatedReorderCost: Number(
        ((i.minimumStock - i.stockQuantity) * i.purchasePrice).toFixed(2),
      ),
      supplier: i.supplier || null,
    })),
  };
};

const suppliersReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
    isDeleted: false,
  };

  const [suppliers, total] = await Promise.all([
    Supplier.find(base).sort({ supplierName: 1 }).skip(skip).limit(limit).lean(),
    Supplier.countDocuments(base),
  ]);

  const supplierNames = suppliers.map((s) => s.supplierName);
  const itemAgg = await InventoryItem.aggregate([
    {
      $match: {
        restaurantId: tenant.restaurantId,
        branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
        supplier: { $in: supplierNames },
      },
    },
    {
      $group: {
        _id: "$supplier",
        itemCount: { $sum: 1 },
        totalValue: { $sum: { $multiply: ["$stockQuantity", "$purchasePrice"] } },
      },
    },
  ]);
  const itemMap = Object.fromEntries(itemAgg.map((a) => [a._id, a]));

  return {
    totalSuppliers: total,
    records: suppliers.map((s) => ({
      supplierId: s._id,
      supplierName: s.supplierName,
      contactPerson: s.contactPerson || null,
      phone: s.phone || null,
      email: s.email || null,
      gstNumber: s.gstNumber || null,
      address: s.address || null,
      status: s.status,
      itemCount: itemMap[s.supplierName]?.itemCount || 0,
      totalStockValue: Number((itemMap[s.supplierName]?.totalValue || 0).toFixed(2)),
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const inventoryUsageReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
    type: { $in: ["usage", "adjustment"] },
  };
  if (body.startDate || body.endDate) {
    filter.createdAt = {};
    if (body.startDate) filter.createdAt.$gte = new Date(body.startDate);
    if (body.endDate) filter.createdAt.$lte = new Date(body.endDate);
  }

  const [summaryAgg, records, total] = await Promise.all([
    InventoryTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalQuantityUsed: { $sum: "$quantity" },
        },
      },
    ]),
    InventoryTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("inventoryItemId", "materialName unit category")
      .populate("createdBy", "name")
      .lean(),
    InventoryTransaction.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalTransactions: 0, totalQuantityUsed: 0 };
  return {
    summary: {
      totalUsageTransactions: s.totalTransactions,
      totalQuantityUsed: s.totalQuantityUsed,
    },
    records: records.map((t) => ({
      transactionId: t._id,
      itemName: t.inventoryItemId?.materialName || "Unknown",
      category: t.inventoryItemId?.category || "Uncategorised",
      unit: t.inventoryItemId?.unit || "",
      type: t.type,
      quantity: t.quantity,
      previousQuantity: t.previousQuantity,
      updatedQuantity: t.updatedQuantity,
      notes: t.notes || null,
      createdBy: t.createdBy?.name || "Unknown",
      createdAt: t.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const purchaseOrdersReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
    type: "purchase",
  };
  if (body.startDate || body.endDate) {
    filter.createdAt = {};
    if (body.startDate) filter.createdAt.$gte = new Date(body.startDate);
    if (body.endDate) filter.createdAt.$lte = new Date(body.endDate);
  }

  const [summaryAgg, records, total] = await Promise.all([
    InventoryTransaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]),
    InventoryTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("inventoryItemId", "materialName unit category purchasePrice supplier")
      .populate("createdBy", "name")
      .lean(),
    InventoryTransaction.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalPurchases: 0, totalQuantity: 0 };
  return {
    summary: {
      totalPurchaseTransactions: s.totalPurchases,
      totalQuantityPurchased: s.totalQuantity,
    },
    records: records.map((t) => ({
      transactionId: t._id,
      itemName: t.inventoryItemId?.materialName || "Unknown",
      category: t.inventoryItemId?.category || "Uncategorised",
      unit: t.inventoryItemId?.unit || "",
      supplier: t.inventoryItemId?.supplier || null,
      purchasePrice: t.inventoryItemId?.purchasePrice || 0,
      quantity: t.quantity,
      totalCost: Number(((t.inventoryItemId?.purchasePrice || 0) * t.quantity).toFixed(2)),
      previousQuantity: t.previousQuantity,
      updatedQuantity: t.updatedQuantity,
      notes: t.notes || null,
      purchasedBy: t.createdBy?.name || "Unknown",
      purchasedAt: t.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Order Reports ─────────────────────────────────────────────────────────────

const ordersReportPost = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = _bodyFilter({ body, tenant });
  if (body.orderStatus) filter.status = body.orderStatus;
  if (body.orderType) filter.orderType = body.orderType;

  const [statusAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: _bodyFilter({ body, tenant }) },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$grandTotal" },
        },
      },
    ]),
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name role")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  const sm = Object.fromEntries(statusAgg.map((a) => [a._id, { count: a.count, revenue: a.revenue }]));
  return {
    summary: {
      totalOrders: Object.values(sm).reduce((s, v) => s + v.count, 0),
      completedOrders: sm.completed?.count || 0,
      cancelledOrders: sm.cancelled?.count || 0,
      pendingOrders: sm.pending?.count || 0,
      heldOrders: sm.held?.count || 0,
      completedRevenue: sm.completed?.revenue || 0,
    },
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      tableName: r.tableName || null,
      grandTotal: r.grandTotal,
      itemCount: r.items?.length || 0,
      status: r.status,
      paymentStatus: r.paymentStatus,
      createdBy: r.createdBy?.name || "Unknown",
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const kotReportPost = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = _bodyFilter({ body, tenant });
  if (body.status) filter.status = body.status;

  const [statusAgg, records, total] = await Promise.all([
    Kot.aggregate([
      { $match: _bodyFilter({ body, tenant }) },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Kot.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("chefId", "name")
      .lean(),
    Kot.countDocuments(filter),
  ]);

  const sm = Object.fromEntries(statusAgg.map((a) => [a._id, a.count]));
  return {
    summary: {
      total: Object.values(sm).reduce((s, v) => s + v, 0),
      pending: sm.pending || 0,
      preparing: sm.preparing || 0,
      ready: sm.ready || 0,
      served: sm.served || 0,
      cancelled: sm.cancelled || 0,
    },
    records: records.map((k) => ({
      kotId: k._id,
      kitchenSection: k.kitchenSection,
      tableName: k.tableName || null,
      itemCount: k.items?.length || 0,
      priority: k.priority,
      status: k.status,
      chef: k.chefId?.name || k.chefName || "Unassigned",
      preparationStartedAt: k.preparationStartedAt || null,
      readyAt: k.readyAt || null,
      createdAt: k.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const cancelledOrdersReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = { ..._bodyFilter({ body, tenant }), status: "cancelled" };

  const [summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalCancelled: { $sum: 1 },
          totalLostRevenue: { $sum: "$grandTotal" },
        },
      },
    ]),
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name role")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalCancelled: 0, totalLostRevenue: 0 };
  return {
    summary: {
      totalCancelledOrders: s.totalCancelled,
      totalLostRevenue: s.totalLostRevenue,
    },
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      tableName: r.tableName || null,
      grandTotal: r.grandTotal,
      itemCount: r.items?.length || 0,
      createdBy: r.createdBy?.name || "Unknown",
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const tableOccupancyReport = async ({ body, tenant }) => {
  const base = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
  };
  const billFilter = { ...base, orderType: "dine_in", status: { $ne: "cancelled" } };
  if (body.startDate || body.endDate) {
    billFilter.createdAt = {};
    if (body.startDate) billFilter.createdAt.$gte = new Date(body.startDate);
    if (body.endDate) billFilter.createdAt.$lte = new Date(body.endDate);
  }

  const [tables, occupancyAgg] = await Promise.all([
    DiningTable.find(base).lean(),
    Bill.aggregate([
      { $match: billFilter },
      {
        $group: {
          _id: "$tableId",
          tableName: { $first: "$tableName" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
        },
      },
    ]),
  ]);

  const occMap = Object.fromEntries(occupancyAgg.map((a) => [String(a._id), a]));
  return {
    totalTables: tables.length,
    records: tables.map((t) => {
      const occ = occMap[String(t._id)] || {};
      return {
        tableId: t._id,
        tableName: t.tableName,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        currentStatus: t.status,
        totalOrders: occ.totalOrders || 0,
        totalRevenue: occ.totalRevenue || 0,
        averageRevenuePerOrder:
          occ.totalOrders
            ? Number((occ.totalRevenue / occ.totalOrders).toFixed(2))
            : 0,
      };
    }),
  };
};

const qrOrdersReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
  };
  if (body.startDate || body.endDate) {
    filter.createdAt = {};
    if (body.startDate) filter.createdAt.$gte = new Date(body.startDate);
    if (body.endDate) filter.createdAt.$lte = new Date(body.endDate);
  }

  const [summaryAgg, records, total] = await Promise.all([
    QrOrder.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$grandTotal" },
          totalTax: { $sum: "$taxTotal" },
          paidOrders: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
        },
      },
    ]),
    QrOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    QrOrder.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalOrders: 0, totalRevenue: 0, totalTax: 0, paidOrders: 0 };
  return {
    summary: {
      totalOrders: s.totalOrders,
      totalRevenue: s.totalRevenue,
      totalTax: s.totalTax,
      paidOrders: s.paidOrders,
      pendingPayment: s.totalOrders - s.paidOrders,
    },
    records: records.map((r) => ({
      orderId: r._id,
      orderNo: r.orderNo,
      customerName: r.customerName || "Guest",
      tableId: r.tableId || null,
      itemCount: r.items?.length || 0,
      grandTotal: r.grandTotal,
      paymentStatus: r.paymentStatus,
      status: r.status,
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

// ── Staff Reports ─────────────────────────────────────────────────────────────

const _staffFilter = ({ body, tenant }) => {
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false };
  filter.branchIds = body.branchId ? _toObjId(body.branchId) : tenant.branchId;
  if (body.department) filter.departmentId = _toObjId(body.department);
  if (body.staffStatus) filter.status = body.staffStatus;
  if (body.role) filter.role = body.role;
  return filter;
};

const staffDirectoryReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = _staffFilter({ body, tenant });

  const [records, total] = await Promise.all([
    User.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate("departmentId", "departmentName")
      .populate("shiftId", "shiftName startTime endTime")
      .populate("designationId", "designationName")
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    totalStaff: total,
    records: records.map((u) => ({
      staffId: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      role: u.role,
      employeeCode: u.employeeCode || null,
      department: u.departmentId?.departmentName || null,
      designation: u.designationId?.designationName || null,
      shift: u.shiftId
        ? {
            name: u.shiftId.shiftName,
            startTime: u.shiftId.startTime,
            endTime: u.shiftId.endTime,
          }
        : null,
      status: u.status,
      dateOfJoining: u.dateOfJoining || null,
      gender: u.gender || null,
      lastLoginAt: u.lastLoginAt || null,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const attendanceReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = _staffFilter({ body, tenant });

  const [records, total] = await Promise.all([
    User.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate("departmentId", "departmentName")
      .populate("shiftId", "shiftName startTime endTime")
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    totalStaff: total,
    note: "Showing staff shift assignments. Dedicated clock-in/out tracking is not yet enabled.",
    records: records.map((u) => ({
      staffId: u._id,
      name: u.name,
      employeeCode: u.employeeCode || null,
      role: u.role,
      department: u.departmentId?.departmentName || null,
      shift: u.shiftId
        ? {
            name: u.shiftId.shiftName,
            startTime: u.shiftId.startTime,
            endTime: u.shiftId.endTime,
          }
        : null,
      status: u.status,
      lastLoginAt: u.lastLoginAt || null,
      dateOfJoining: u.dateOfJoining || null,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const departmentReport = async ({ body, tenant }) => {
  const staffFilter = _staffFilter({ body, tenant });

  const [departments, staffByDept] = await Promise.all([
    Department.find({ restaurantId: tenant.restaurantId, isDeleted: false }).lean(),
    User.aggregate([
      { $match: staffFilter },
      {
        $group: {
          _id: "$departmentId",
          staffCount: { $sum: 1 },
          activeStaff: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          roles: { $addToSet: "$role" },
        },
      },
    ]),
  ]);

  const deptMap = Object.fromEntries(staffByDept.map((a) => [String(a._id), a]));
  return {
    totalDepartments: departments.length,
    records: departments.map((d) => {
      const stats = deptMap[String(d._id)] || {};
      return {
        departmentId: d._id,
        departmentName: d.departmentName,
        status: d.status,
        staffCount: stats.staffCount || 0,
        activeStaff: stats.activeStaff || 0,
        roles: stats.roles || [],
      };
    }),
  };
};

const shiftsReport = async ({ body, tenant }) => {
  const staffFilter = _staffFilter({ body, tenant });

  const [shifts, staffByShift] = await Promise.all([
    Shift.find({ restaurantId: tenant.restaurantId, isDeleted: false }).lean(),
    User.aggregate([
      { $match: staffFilter },
      {
        $group: {
          _id: "$shiftId",
          staffCount: { $sum: 1 },
          activeStaff: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const shiftMap = Object.fromEntries(staffByShift.map((a) => [String(a._id), a]));
  const unassigned = staffByShift.find((a) => a._id === null)?.staffCount || 0;

  return {
    totalShifts: shifts.length,
    unassignedStaff: unassigned,
    records: shifts.map((s) => {
      const stats = shiftMap[String(s._id)] || {};
      return {
        shiftId: s._id,
        shiftName: s.shiftName,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        staffCount: stats.staffCount || 0,
        activeStaff: stats.activeStaff || 0,
      };
    }),
  };
};

// ── Financial Reports ─────────────────────────────────────────────────────────

const expensesReportPost = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
    isDeleted: false,
  };
  if (body.startDate || body.endDate) {
    filter.expenseDate = {};
    if (body.startDate) filter.expenseDate.$gte = new Date(body.startDate);
    if (body.endDate) filter.expenseDate.$lte = new Date(body.endDate);
  }
  if (body.category) filter.category = body.category;
  if (body.paymentMode) filter.paymentMode = body.paymentMode;

  const [summaryAgg, byCategory, byPaymentMode, records, total] = await Promise.all([
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: "$category", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: "$_id", amount: 1, count: 1 } },
      { $sort: { amount: -1 } },
    ]),
    Expense.aggregate([
      { $match: filter },
      { $group: { _id: "$paymentMode", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $project: { _id: 0, paymentMode: "$_id", amount: 1, count: 1 } },
      { $sort: { amount: -1 } },
    ]),
    Expense.find(filter)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    Expense.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalAmount: 0, count: 0 };
  return {
    totalAmount: s.totalAmount,
    totalCount: s.count,
    byCategory,
    byPaymentMode,
    records: records.map((e) => ({
      expenseId: e._id,
      expenseName: e.expenseName,
      category: e.category,
      amount: e.amount,
      expenseDate: e.expenseDate,
      paymentMode: e.paymentMode,
      notes: e.notes || null,
      createdBy: e.createdBy?.name || "Unknown",
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const profitLossReportPost = async ({ body, tenant }) => {
  const billFilter = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
  };
  if (body.startDate || body.endDate) {
    billFilter.createdAt = {};
    if (body.startDate) billFilter.createdAt.$gte = new Date(body.startDate);
    if (body.endDate) billFilter.createdAt.$lte = new Date(body.endDate);
  }
  const expenseFilter = {
    restaurantId: tenant.restaurantId,
    branchId: body.branchId ? _toObjId(body.branchId) : tenant.branchId,
    isDeleted: false,
  };
  if (body.startDate || body.endDate) {
    expenseFilter.expenseDate = {};
    if (body.startDate) expenseFilter.expenseDate.$gte = new Date(body.startDate);
    if (body.endDate) expenseFilter.expenseDate.$lte = new Date(body.endDate);
  }
  const activeBillFilter = { ...billFilter, status: { $ne: "cancelled" } };
  const fmt = _groupFormat(body.groupBy || "month");

  const [salesAgg, expenseAgg, periodSales, periodExpenses] = await Promise.all([
    Bill.aggregate([
      { $match: activeBillFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalCOGS: { $sum: "$subTotal" },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
    ]),
    Bill.aggregate([
      { $match: activeBillFilter },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: "$createdAt" } },
          revenue: { $sum: "$grandTotal" },
          cogs: { $sum: "$subTotal" },
          tax: { $sum: "$taxTotal" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Expense.aggregate([
      { $match: expenseFilter },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: "$expenseDate" } },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const s = salesAgg[0] || { totalRevenue: 0, totalCOGS: 0, totalTax: 0, totalDiscount: 0, totalOrders: 0 };
  const e = expenseAgg[0] || { totalExpenses: 0 };
  const grossProfit = Number((s.totalRevenue - s.totalCOGS).toFixed(2));
  const netProfit = Number((grossProfit - e.totalExpenses).toFixed(2));

  const expMap = Object.fromEntries(periodExpenses.map((r) => [r._id, r.expenses]));
  const periodBreakdown = periodSales.map((row) => {
    const exp = expMap[row._id] || 0;
    const gross = Number((row.revenue - row.cogs).toFixed(2));
    return {
      period: row._id,
      revenue: row.revenue,
      cogs: row.cogs,
      grossProfit: gross,
      expenses: exp,
      netProfit: Number((gross - exp).toFixed(2)),
      tax: row.tax,
      orders: row.orders,
    };
  });

  return {
    summary: {
      totalRevenue: s.totalRevenue,
      totalCOGS: s.totalCOGS,
      grossProfit,
      totalExpenses: e.totalExpenses,
      netProfit,
      totalTax: s.totalTax,
      totalDiscount: s.totalDiscount,
      totalOrders: s.totalOrders,
      grossMargin:
        s.totalRevenue > 0 ? Number(((grossProfit / s.totalRevenue) * 100).toFixed(2)) : 0,
      netMargin:
        s.totalRevenue > 0 ? Number(((netProfit / s.totalRevenue) * 100).toFixed(2)) : 0,
    },
    periodBreakdown,
  };
};

const billSettlementReport = async ({ body, tenant }) => {
  const { page, limit, skip } = parsePagination(body);
  const filter = { ..._bodyFilter({ body, tenant }), status: "completed" };

  const [byMethodAgg, summaryAgg, records, total] = await Promise.all([
    Bill.aggregate([
      { $match: filter },
      { $unwind: "$payments" },
      {
        $group: {
          _id: "$payments.method",
          totalAmount: { $sum: "$payments.amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, method: "$_id", totalAmount: 1, transactionCount: 1 } },
      { $sort: { totalAmount: -1 } },
    ]),
    Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSettled: { $sum: "$grandTotal" },
          totalBills: { $sum: 1 },
          totalTax: { $sum: "$taxTotal" },
          totalDiscount: { $sum: "$discountTotal" },
        },
      },
    ]),
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  const s = summaryAgg[0] || { totalSettled: 0, totalBills: 0, totalTax: 0, totalDiscount: 0 };
  return {
    summary: {
      totalSettled: s.totalSettled,
      totalBills: s.totalBills,
      totalTax: s.totalTax,
      totalDiscount: s.totalDiscount,
    },
    byPaymentMethod: byMethodAgg,
    records: records.map((r) => ({
      billId: r._id,
      billNo: r.billNo,
      orderType: r.orderType,
      tableName: r.tableName || null,
      grandTotal: r.grandTotal,
      paymentMethods: (r.payments || []).map((p) => ({ method: p.method, amount: p.amount })),
      paymentStatus: r.paymentStatus,
      createdBy: r.createdBy?.name || "Unknown",
      createdAt: r.createdAt,
    })),
    meta: paginationMeta({ total, page, limit }),
  };
};

const taxSummaryReport = async ({ body, tenant }) => {
  const filter = { ..._bodyFilter({ body, tenant }), status: { $ne: "cancelled" } };
  const fmt = _groupFormat(body.groupBy || "day");

  const [summaryAgg, trend] = await Promise.all([
    Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTaxCollected: { $sum: "$taxTotal" },
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
        },
      },
    ]),
    Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: "$createdAt" } },
          taxCollected: { $sum: "$taxTotal" },
          revenue: { $sum: "$grandTotal" },
          orders: { $sum: 1 },
        },
      },
      { $project: { _id: 0, period: "$_id", taxCollected: 1, revenue: 1, orders: 1 } },
      { $sort: { period: 1 } },
    ]),
  ]);

  const s = summaryAgg[0] || { totalTaxCollected: 0, totalRevenue: 0, totalOrders: 0 };
  const tax = s.totalTaxCollected;
  return {
    summary: {
      totalTaxCollected: tax,
      cgst: Number((tax / 2).toFixed(2)),
      sgst: Number((tax / 2).toFixed(2)),
      igst: 0,
      totalRevenue: s.totalRevenue,
      totalOrders: s.totalOrders,
      effectiveTaxRate:
        s.totalRevenue > 0 ? Number(((tax / s.totalRevenue) * 100).toFixed(2)) : 0,
    },
    trend,
  };
};

module.exports = {
  dailySales,
  monthlySales,
  profitReport,
  expenseReport,
  itemSales,
  taxReport,
  kotReport,
  dashboardSummary,
  topSellingItems,
  peakHours,
  revenueAnalytics,
  expenseAnalytics,
  // new
  salesReport,
  ordersReport,
  topSellingItemsReport,
  leastSellingItemsReport,
  staffPerformanceReport,
  customersReport,
  taxDetailReport,
  branchesReport,
  auditLogsReport,
  inventoryReport,
  expensesDetailReport,
  profitLossReport,
  // POST-based reports
  salesReportPost,
  salesSummaryReport,
  revenueReport,
  hourlySalesReport,
  topItemsReport,
  salesByCategoryReport,
  inventoryStockReport,
  lowStockReport,
  suppliersReport,
  inventoryUsageReport,
  purchaseOrdersReport,
  ordersReportPost,
  kotReportPost,
  cancelledOrdersReport,
  tableOccupancyReport,
  qrOrdersReport,
  staffDirectoryReport,
  attendanceReport,
  departmentReport,
  shiftsReport,
  expensesReportPost,
  profitLossReportPost,
  billSettlementReport,
  taxSummaryReport,
};
