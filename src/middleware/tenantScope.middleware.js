const AppError = require("../utils/AppError");

const attachTenantScope = (req, res, next) => {
  if (!req.user?.restaurantId) return next(new AppError("Restaurant context missing", 400));
  req.tenant = {
    tenantId: req.user.restaurantId,
    restaurantId: req.user.restaurantId,
    branchId: req.user.activeBranchId,
    filter: (extra = {}) => ({ ...extra, restaurantId: req.user.restaurantId }),
    branchFilter: (extra = {}) => ({
      ...extra,
      restaurantId: req.user.restaurantId,
      branchId: req.user.activeBranchId
    })
  };
  return next();
};

module.exports = attachTenantScope;
