const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/branch.service");

const create = asyncHandler(async (req, res) => {
  const data = await service.createBranch({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Branch created successfully",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateBranch({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Branch updated successfully",
    data,
  });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteBranch({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Branch deleted successfully",
  });
});

const get = asyncHandler(async (req, res) => {
  const data = await service.getBranch({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Branch fetched successfully",
    data,
  });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listBranches({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Branches fetched successfully",
    data: items,
    meta,
  });
});

module.exports = { create, update, remove, get, list };
