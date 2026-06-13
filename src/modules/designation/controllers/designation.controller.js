const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const designationService = require("../services/designation.service");

const create = asyncHandler(async (req, res) => {
  const data = await designationService.createDesignation({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: "Designation created", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await designationService.updateDesignation({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Designation updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await designationService.deleteDesignation({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Designation deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await designationService.getDesignation({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Designation fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await designationService.listDesignations({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Designations fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
