const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/supplier.service");

const create = asyncHandler(async (req, res) => {
  const data = await service.createSupplier({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    file: req.file,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Supplier created successfully",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateSupplier({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    file: req.file,
  });
  sendSuccess(res, { message: "Supplier updated successfully", data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteSupplier({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Supplier deleted successfully" });
});

const get = asyncHandler(async (req, res) => {
  const data = await service.getSupplier({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Supplier fetched successfully", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listSuppliers({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, {
    message: "Suppliers fetched successfully",
    data: items,
    meta,
  });
});

module.exports = { create, update, remove, get, list };
