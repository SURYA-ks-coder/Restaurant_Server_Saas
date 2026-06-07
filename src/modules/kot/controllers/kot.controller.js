const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const kotService = require("../services/kot.service");

const create = asyncHandler(async (req, res) => {
  const data = await kotService.createKot({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "KOT created",
    data,
  });
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await kotService.updateKotStatus({
    id: req.body.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "KOT status updated", data });
});

const updateItemStatus = asyncHandler(async (req, res) => {
  const data = await kotService.updateKotItemStatus({
    id: req.body.id,
    itemId: req.body.itemId,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "KOT item status updated", data });
});

const updatePriority = asyncHandler(async (req, res) => {
  const data = await kotService.updateKotPriority({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "KOT priority updated", data });
});

const markServed = asyncHandler(async (req, res) => {
  const data = await kotService.markKotServed({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "KOT marked served", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await kotService.getKot({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "KOT fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await kotService.listKots({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "KOTs fetched", data: items, meta });
});

module.exports = {
  create,
  updateStatus,
  updateItemStatus,
  updatePriority,
  markServed,
  get,
  list,
};
