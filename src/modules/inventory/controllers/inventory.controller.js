const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const inventoryService = require("../services/inventory.service");

const create = asyncHandler(async (req, res) => {
  const data = await inventoryService.createInventoryItem({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Inventory item created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await inventoryService.updateInventoryItem({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Inventory item updated", data });
});

const addStock = asyncHandler(async (req, res) => {
  const data = await inventoryService.adjustStock({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    type: "purchase",
  });
  sendSuccess(res, { message: "Stock added", data });
});

const removeStock = asyncHandler(async (req, res) => {
  const data = await inventoryService.adjustStock({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
    type: "usage",
  });
  sendSuccess(res, { message: "Stock removed", data });
});

const stockCount = asyncHandler(async (req, res) => {
  const data = await inventoryService.recordStockCount({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    message: `Stock count recorded (${data.adjustedCount} of ${data.countedItems} items adjusted)`,
    data,
  });
});

const reorderSuggestions = asyncHandler(async (req, res) => {
  const data = await inventoryService.reorderSuggestions({
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Reorder suggestions fetched", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await inventoryService.getInventoryItem({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Inventory item fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await inventoryService.listInventoryItems({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Inventory items fetched", data: items, meta });
});

const lowStock = asyncHandler(async (req, res) => {
  const data = await inventoryService.listLowStock({ tenant: req.tenant });
  sendSuccess(res, { message: "Low stock items fetched", data });
});

const report = asyncHandler(async (req, res) => {
  const data = await inventoryService.inventoryReport({ tenant: req.tenant });
  sendSuccess(res, { message: "Inventory report", data });
});

const history = asyncHandler(async (req, res) => {
  const data = await inventoryService.getStockHistory({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Inventory history fetched", data });
});

module.exports = {
  create,
  update,
  addStock,
  removeStock,
  stockCount,
  reorderSuggestions,
  get,
  list,
  lowStock,
  report,
  history,
};
