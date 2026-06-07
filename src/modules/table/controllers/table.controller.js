const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const tableService = require("../services/table.service");

const create = asyncHandler(async (req, res) => {
  const data = await tableService.createTable({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Table created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await tableService.updateTable({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table updated successfully", data });
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await tableService.updateTableStatus({
    id: req.body?.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table status updated successfully", data });
});

const markOccupied = asyncHandler(async (req, res) => {
  const data = await tableService.updateTableStatus({
    id: req.params.id,
    payload: { status: "occupied" },
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table marked occupied successfully", data });
});

const markFree = asyncHandler(async (req, res) => {
  const data = await tableService.updateTableStatus({
    id: req.params.id,
    payload: { status: "available" },
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table marked free successfully", data });
});

const generateQrCode = asyncHandler(async (req, res) => {
  const data = await tableService.generateTableQrCode({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table QR code generated successfully", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await tableService.getTable({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Table fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await tableService.listTables({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Tables fetched", data: items, meta });
});

const activeList = asyncHandler(async (req, res) => {
  const { items, meta } = await tableService.listActiveTables({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Active tables fetched", data: items, meta });
});

module.exports = {
  create,
  update,
  updateStatus,
  markOccupied,
  markFree,
  generateQrCode,
  get,
  list,
  activeList,
};
