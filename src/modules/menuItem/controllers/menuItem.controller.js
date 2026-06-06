const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/menuItem.service");

const create = asyncHandler(async (req, res) => {
  const data = await service.createMenuItem({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    file: req.file,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Menu item created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateMenuItem({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    file: req.file,
  });
  sendSuccess(res, { message: "Menu item updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteMenuItem({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Menu item deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await service.getMenuItem({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Menu item fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMenuItems({
    query: req.query,
    tenant: req.tenant || req.body,
  });
  sendSuccess(res, { message: "Menu items fetched", data: items, meta });
});

const availability = asyncHandler(async (req, res) => {
  const data = await service.updateAvailability({
    id: req.params.id,
    availabilityStatus: req.body.availabilityStatus,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Availability updated", data });
});

const prices = asyncHandler(async (req, res) => {
  const data = await service.updatePrices({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Prices updated", data });
});

const lowStock = asyncHandler(async (req, res) => {
  const data = await service.lowStockAlerts(req.tenant);
  sendSuccess(res, { message: "Low stock menu items fetched", data });
});

module.exports = {
  create,
  update,
  remove,
  get,
  list,
  availability,
  prices,
  lowStock,
};
