const { sendSuccess } = require("../../../helpers/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");
const stockTransferService = require("../services/stockTransfer.service");

const create = asyncHandler(async (req, res) => {
  const data = await stockTransferService.createTransfer({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { statusCode: 201, message: "Transfer request created", data });
});

const approve = asyncHandler(async (req, res) => {
  const data = await stockTransferService.approveTransfer({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Transfer approved", data });
});

const complete = asyncHandler(async (req, res) => {
  const data = await stockTransferService.completeTransfer({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Transfer completed and stock updated", data });
});

const reject = asyncHandler(async (req, res) => {
  const data = await stockTransferService.rejectTransfer({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Transfer rejected", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await stockTransferService.getTransfer({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Transfer fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await stockTransferService.listTransfers({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Transfers fetched", data: items, meta });
});

module.exports = { create, approve, complete, reject, get, list };
