const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const service = require("../services/subscription.service");

const createPlan = asyncHandler(async (req, res) => {
  const data = await service.createPlan(req.body);
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: "Subscription plan created", data });
});

const updatePlan = asyncHandler(async (req, res) => {
  const data = await service.updatePlan({ id: req.params.id, payload: req.body });
  sendSuccess(res, { message: "Subscription plan updated", data });
});

const listPlans = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listPlans(req.query);
  sendSuccess(res, { message: "Subscription plans fetched", data: items, meta });
});

const current = asyncHandler(async (req, res) => {
  const data = await service.getCurrentSubscription(req.tenant.restaurantId);
  sendSuccess(res, { message: "Current subscription fetched", data });
});

const selectPlan = asyncHandler(async (req, res) => {
  const data = await service.changePlan({
    restaurantId: req.tenant.restaurantId,
    planId: req.body.planId,
    userId: req.user.id
  });
  sendSuccess(res, { message: "Subscription plan selected", data });
});

const expire = asyncHandler(async (req, res) => {
  const data = await service.expireSubscriptions();
  sendSuccess(res, { message: "Expired subscriptions processed", data });
});

module.exports = { createPlan, updatePlan, listPlans, current, selectPlan, expire };
