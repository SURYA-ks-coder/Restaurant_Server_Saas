const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const purchaseService = require("../services/purchase.service");

const create = asyncHandler(async (req, res) => {
  const data = await purchaseService.createPurchase({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Purchase recorded and stock updated",
    data,
  });
});

const cancel = asyncHandler(async (req, res) => {
  const data = await purchaseService.cancelPurchase({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Purchase cancelled and stock reversed", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await purchaseService.getPurchase({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Purchase fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await purchaseService.listPurchases({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Purchases fetched", data: items, meta });
});

const summary = asyncHandler(async (req, res) => {
  const data = await purchaseService.purchaseSummary({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Purchase summary", data });
});

module.exports = { create, cancel, get, list, summary };
