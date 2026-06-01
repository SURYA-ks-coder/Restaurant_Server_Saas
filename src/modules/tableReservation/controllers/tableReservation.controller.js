const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const reservationService = require("../services/tableReservation.service");

const create = asyncHandler(async (req, res) => {
  const data = await reservationService.createReservation({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Table reservation created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await reservationService.updateReservation({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table reservation updated", data });
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await reservationService.updateReservationStatus({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table reservation status updated", data });
});

const cancel = asyncHandler(async (req, res) => {
  const data = await reservationService.updateReservationStatus({
    id: req.params.id,
    payload: { status: "cancelled", cancellationReason: req.body?.cancellationReason },
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table reservation cancelled", data });
});

const remove = asyncHandler(async (req, res) => {
  const data = await reservationService.updateReservationStatus({
    id: req.params.id,
    payload: { status: "cancelled", cancellationReason: "Deleted by staff" },
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table reservation deleted", data });
});

const seat = asyncHandler(async (req, res) => {
  const data = await reservationService.updateReservationStatus({
    id: req.params.id,
    payload: { status: "seated" },
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Guest seated", data });
});

const complete = asyncHandler(async (req, res) => {
  const data = await reservationService.updateReservationStatus({
    id: req.params.id,
    payload: { status: "completed" },
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Table reservation completed", data });
});

const get = asyncHandler(async (req, res) => {
  const data = await reservationService.getReservation({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Table reservation fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await reservationService.listReservations({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Table reservations fetched", data: items, meta });
});

module.exports = {
  create,
  update,
  updateStatus,
  cancel,
  remove,
  seat,
  complete,
  get,
  list,
};
