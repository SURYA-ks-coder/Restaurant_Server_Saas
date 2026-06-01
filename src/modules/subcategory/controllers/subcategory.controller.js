const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/subcategory.service");

const create = asyncHandler(async (req, res) => {
  const data = await service.createSubcategory({ payload: req.body, tenant: req.tenant, user: req.user });
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: "Subcategory created", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateSubcategory({ id: req.params.id, payload: req.body, tenant: req.tenant, user: req.user });
  sendSuccess(res, { message: "Subcategory updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteSubcategory({ id: req.params.id, tenant: req.tenant, user: req.user });
  sendSuccess(res, { message: "Subcategory deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await service.getSubcategory({ id: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "Subcategory fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listSubcategories({ query: req.query, tenant: req.tenant });
  sendSuccess(res, { message: "Subcategories fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
