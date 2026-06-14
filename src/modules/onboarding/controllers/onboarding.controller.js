const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/onboarding.service");

const register = asyncHandler(async (req, res) => {
  const data = await service.registerRestaurant({
    payload: req.body,
    file: req.file,
  });
  sendSuccess(res, {
    statusCode: 200,
    message: "Restaurant onboarded successfully",
    data,
  });
});

const setupWizard = asyncHandler(async (req, res) => {
  const data = await service.updateSetupWizard({
    tenant: req.tenant,
    user: req.user,
    payload: req.body,
    file: req.file,
  });
  sendSuccess(res, { message: "Setup wizard updated", data });
});

const uploadLogo = asyncHandler(async (req, res) => {
  const data = await service.uploadLogo({ tenant: req.tenant, file: req.file });
  sendSuccess(res, { message: "Restaurant logo uploaded", data });
});

const checkDomain = asyncHandler(async (req, res) => {
  const data = await service.checkDomainAvailability(req.body);
  sendSuccess(res, { message: "Domain availability checked", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listRestaurants({ query: req.query });
  sendSuccess(res, { message: "Restaurants fetched", data: items, meta });
});

const get = asyncHandler(async (req, res) => {
  const data = await service.getRestaurant({ id: req.params.id });
  sendSuccess(res, { message: "Restaurant fetched", data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateRestaurant({
    id: req.params.id,
    payload: req.body,
    file: req.file,
  });
  sendSuccess(res, { message: "Restaurant updated", data });
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateRestaurantStatus({
    id: req.params.id,
    status: req.body.status,
  });
  sendSuccess(res, { message: "Restaurant status updated", data });
});

module.exports = { register, setupWizard, uploadLogo, checkDomain, list, get, update, updateStatus };
