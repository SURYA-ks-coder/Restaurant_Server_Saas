const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const posService = require("../services/pos.service");

const create = asyncHandler(async (req, res) => {
  const data = await posService.createBill({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Order created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await posService.updateBill({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Order updated", data });
});

const addItem = asyncHandler(async (req, res) => {
  const data = await posService.addBillItem({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Item added", data });
});

const updateItemQuantity = asyncHandler(async (req, res) => {
  const data = await posService.updateBillItemQuantity({
    id: req.params.id,
    itemId: req.params.itemId,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Item quantity updated", data });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await posService.removeBillItem({
    id: req.params.id,
    itemId: req.params.itemId,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Item removed", data });
});

const applyDiscount = asyncHandler(async (req, res) => {
  const data = await posService.applyBillDiscount({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Discount applied", data });
});

const recordPayment = asyncHandler(async (req, res) => {
  const data = await posService.recordPayment({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Payment recorded", data });
});

const holdOrder = asyncHandler(async (req, res) => {
  const data = await posService.holdBill({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Order held", data });
});

const resumeOrder = asyncHandler(async (req, res) => {
  const data = await posService.resumeBill({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Order resumed", data });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const data = await posService.cancelBill({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Order cancelled", data });
});

const generateInvoice = asyncHandler(async (req, res) => {
  const data = await posService.generateInvoice({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Invoice generated", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await posService.getBill({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Order fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await posService.listBills({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Orders fetched", data: items, meta });
});

module.exports = {
  create,
  update,
  addItem,
  updateItemQuantity,
  removeItem,
  applyDiscount,
  recordPayment,
  holdOrder,
  resumeOrder,
  cancelOrder,
  generateInvoice,
  get,
  list,
};
