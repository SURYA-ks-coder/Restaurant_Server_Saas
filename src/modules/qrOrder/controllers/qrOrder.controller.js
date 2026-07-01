const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const qrOrderService = require("../services/qrOrder.service");
const { verifyQrToken } = require("../../../utils/token");

const create = asyncHandler(async (req, res) => {
  const data = await qrOrderService.createQrOrder({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "QR order session created",
    data,
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const data = await qrOrderService.updateQrOrderCart({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "QR order cart updated", data });
});

const placeOrder = asyncHandler(async (req, res) => {
  const data = await qrOrderService.placeQrOrder({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "QR order placed", data });
});

const recordPayment = asyncHandler(async (req, res) => {
  const data = await qrOrderService.recordQrPayment({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "QR order payment recorded", data });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const data = await qrOrderService.cancelQrOrder({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "QR order cancelled", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await qrOrderService.getQrOrder({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "QR order fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await qrOrderService.listQrOrders({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "QR orders fetched", data: items, meta });
});

const resolveToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: "token is required" });
  }
  try {
    const { restaurantId, branchId, tableId, tableNumber } = verifyQrToken(token);
    sendSuccess(res, { message: "QR token resolved", data: { restaurantId, branchId, tableId, tableNumber } });
  } catch {
    res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Invalid or tampered QR code" });
  }
});

module.exports = {
  create,
  updateCart,
  placeOrder,
  recordPayment,
  cancelOrder,
  get,
  list,
  resolveToken,
};
