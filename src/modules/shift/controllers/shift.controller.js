const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const shiftService = require("../services/shift.service");

const create = asyncHandler(async (req, res) => {
  const data = await shiftService.createShift({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: "Shift created", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await shiftService.updateShift({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Shift updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await shiftService.deleteShift({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Shift deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await shiftService.getShift({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Shift fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await shiftService.listShifts({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Shifts fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
