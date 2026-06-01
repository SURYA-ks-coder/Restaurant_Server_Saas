const AppError = require("../utils/AppError");
const subscriptionService = require("../modules/subscription/services/subscription.service");

const requireFeature = (feature) => async (req, res, next) => {
  try {
    if (!req.tenant?.restaurantId) throw new AppError("Tenant context missing", 400);
    req.subscription = await subscriptionService.hasFeature({
      restaurantId: req.tenant.restaurantId,
      feature
    });
    next();
  } catch (error) {
    next(error);
  }
};

const enforcePlanLimit = (resource) => async (req, res, next) => {
  try {
    if (!req.tenant?.restaurantId) throw new AppError("Tenant context missing", 400);
    await subscriptionService.assertLimit({
      restaurantId: req.tenant.restaurantId,
      resource
    });
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireFeature, enforcePlanLimit };
