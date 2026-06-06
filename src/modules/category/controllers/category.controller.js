const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/category.service");

const create = asyncHandler(async (req, res) => {
  const data = await service.createCategory({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    file: req.file,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateCategory({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    file: req.file,
  });
  sendSuccess(res, { message: "Category updated successfully", data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteCategory({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Category deleted successfully" });
});

const get = asyncHandler(async (req, res) => {
  const data = await service.getCategory({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Category fetched successfully", data });
});

const list = asyncHandler(async (req, res) => {
  try {
    const { items, meta } = await service.listCategories({
      query: req.query,
      tenant: req.tenant || {
        branchId: req.body.branchId,
        restaurantId: req.body.restaurantId,
      },
    });
    sendSuccess(res, {
      message: "Categories fetched successfully",
      data: items,
      meta,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
});

module.exports = { create, update, remove, get, list };
