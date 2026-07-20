const httpStatus = require("http-status");
const uuid = require("uuid");
const QrOrderRepository = require("../repositories/qrOrder.repository");
const AppError = require("../../../utils/AppError");
const { getIo } = require("../../../sockets");
const { notify } = require("../../../sockets/notify");
const printService = require("../../print/services/print.service");

const calculateTotals = ({ items, taxRate = 0, discount = 0 }) => {
  const subTotal = items.reduce((total, item) => total + item.total, 0);
  const taxTotal = Number(((subTotal * taxRate) / 100).toFixed(2));
  const discountTotal = Number(discount.toFixed(2));
  const grandTotal = Number((subTotal + taxTotal - discountTotal).toFixed(2));

  return { subTotal, taxRate, taxTotal, discount, discountTotal, grandTotal };
};

const createQrOrder = async ({ payload, tenant, user }) => {
  const sessionToken = uuid.v4();
  const orderNo = `QR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const totals = calculateTotals(payload);

  const qrOrder = await QrOrderRepository.create({
    ...(payload || {}),
    sessionToken,
    orderNo,
    status: "pending",
    paymentStatus: "pending",
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
    ...totals,
  });

  const io = getIo();
  if (io) {
    io.to(`branch:${tenant.branchId}`).emit("qrOrder:created", qrOrder);
  }

  return qrOrder;
};

const getQrOrder = async ({ id, tenant }) => {
  const qrOrder = await QrOrderRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!qrOrder) {
    throw new AppError("QR order session not found", httpStatus.NOT_FOUND);
  }
  return qrOrder;
};

const listQrOrders = async ({ query, tenant }) => {
  const { page, limit, skip } =
    require("../../../helpers/queryBuilder").parsePagination(query);
  const sort = require("../../../helpers/queryBuilder").parseSort(query, [
    "createdAt",
    "grandTotal",
  ]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

  const [items, total] = await QrOrderRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });

  return {
    items,
    meta: require("../../../helpers/queryBuilder").paginationMeta({
      total,
      page,
      limit,
    }),
  };
};

const updateQrOrderCart = async ({ id, payload, tenant }) => {
  const qrOrder = await getQrOrder({ id, tenant });
  if (["cancelled", "completed"].includes(qrOrder.status)) {
    throw new AppError(
      "Cannot change cart for a finished QR order",
      httpStatus.BAD_REQUEST,
    );
  }

  const totals = calculateTotals({
    ...payload,
    taxRate: qrOrder.taxRate,
    discount: qrOrder.discount,
  });
  const updated = await QrOrderRepository.updateById(id, {
    items: payload.items,
    ...totals,
  });
  const io = getIo();
  if (io) {
    io.to(`branch:${tenant.branchId}`).emit("qrOrder:updated", updated);
  }
  return updated;
};

const placeQrOrder = async ({ id, tenant }) => {
  const qrOrder = await getQrOrder({ id, tenant });
  if (qrOrder.status !== "pending") {
    throw new AppError(
      "Only pending QR orders can be placed",
      httpStatus.BAD_REQUEST,
    );
  }

  const updated = await QrOrderRepository.updateById(id, {
    status: "confirmed",
    confirmedAt: new Date(),
  });
  const io = getIo();
  if (io) {
    io.to(`branch:${tenant.branchId}`).emit("qrOrder:placed", updated);
  }

  notify(tenant.branchId, {
    type: "order_created",
    title: `New QR Order #${updated.orderNo}`,
    description: `${updated.items.length} items · ₹${updated.grandTotal}`,
    meta: { qrOrderId: updated._id, orderNo: updated.orderNo },
  });

  printService.printQrOrder({ qrOrderId: id, tenant }).catch((err) => {
    console.error("Error printing QR order slip:", err.message);
  });

  return updated;
};

const recordQrPayment = async ({ id, payload, tenant }) => {
  const qrOrder = await getQrOrder({ id, tenant });
  if (qrOrder.status === "cancelled") {
    throw new AppError(
      "Cannot record payment for a cancelled QR order",
      httpStatus.BAD_REQUEST,
    );
  }

  const payment = {
    method: payload.method,
    amount: payload.amount,
    transactionRef: payload.transactionRef || null,
    paidAt: new Date(),
  };

  const payments = [...(qrOrder.payments || []), payment];
  const paidAmount = payments.reduce((sum, paymentItem) => sum + Number(paymentItem.amount || 0), 0);
  const paymentStatus = paidAmount >= qrOrder.grandTotal ? "paid" : "pending";
  const updated = await QrOrderRepository.updateById(id, {
    payments,
    paymentStatus,
  });

  const io = getIo();
  if (io) {
    io.to(`branch:${tenant.branchId}`).emit("qrOrder:payment", updated);
  }

  if (paymentStatus === "paid") {
    notify(tenant.branchId, {
      type: "payment_received",
      title: "Payment Received",
      description: `QR Order #${updated.orderNo} · ₹${updated.grandTotal}`,
      meta: { qrOrderId: updated._id, orderNo: updated.orderNo },
    });
  }

  return updated;
};

const cancelQrOrder = async ({ id, tenant }) => {
  const qrOrder = await getQrOrder({ id, tenant });
  if (qrOrder.status === "cancelled") {
    throw new AppError("QR order is already cancelled", httpStatus.BAD_REQUEST);
  }

  const updated = await QrOrderRepository.updateById(id, {
    status: "cancelled",
    cancelledAt: new Date(),
  });
  const io = getIo();
  if (io) {
    io.to(`branch:${tenant.branchId}`).emit("qrOrder:cancelled", updated);
  }

  notify(tenant.branchId, {
    type: "order_cancelled",
    title: `QR Order #${updated.orderNo} Cancelled`,
    description: `${updated.items.length} items · ₹${updated.grandTotal}`,
    meta: { qrOrderId: updated._id, orderNo: updated.orderNo },
  });

  return updated;
};

module.exports = {
  createQrOrder,
  getQrOrder,
  listQrOrders,
  updateQrOrderCart,
  placeQrOrder,
  recordQrPayment,
  cancelQrOrder,
};
