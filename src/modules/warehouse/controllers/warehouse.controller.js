const { sendSuccess } = require("../../../helpers/apiResponse");
const asyncHandler = require("../../../utils/asyncHandler");
const warehouseService = require("../services/warehouse.service");

const create = asyncHandler(async (req, res) => {
  const data = await warehouseService.createWarehouse({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { statusCode: 201, message: "Warehouse created", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await warehouseService.updateWarehouse({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Warehouse updated", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await warehouseService.getWarehouse({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Warehouse fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await warehouseService.listWarehouses({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Warehouses fetched", data: items, meta });
});

const remove = asyncHandler(async (req, res) => {
  await warehouseService.deleteWarehouse({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Warehouse deleted" });
});

module.exports = { create, update, get, list, remove };
