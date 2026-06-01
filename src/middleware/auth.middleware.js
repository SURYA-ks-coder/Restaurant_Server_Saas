const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const User = require("../modules/auth/models/User.model");
const Branch = require("../modules/branch/models/Branch.model");

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new AppError("Authentication token missing", 401);

    const payload = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findOne({ _id: payload.sub, status: "active", isDeleted: false }).select(
      "+passwordChangedAt"
    );
    if (!user) throw new AppError("User no longer exists or is inactive", 401);
    const tokenTenantId = payload.tenantId || payload.restaurantId;
    if (tokenTenantId && String(tokenTenantId) !== String(user.restaurantId)) {
      throw new AppError("JWT tenant claim does not match user tenant", 401);
    }

    req.user = {
      id: user._id,
      restaurantId: user.restaurantId,
      branchIds: user.branchIds,
      activeBranchId: req.headers["x-branch-id"] || user.defaultBranchId,
      role: user.role,
      permissions: user.permissions,
      email: user.email
    };
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError("Invalid or expired token", 401));
  }
};

const authorize = (...requiredPermissions) => (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required", 401));
  if (req.user.role === "owner" || req.user.role === "super_admin") return next();
  const permissions = req.user.permissions || [];
  const allowed = requiredPermissions.every((permission) => permissions.includes(permission));
  if (!allowed) return next(new AppError("You do not have permission to access this resource", 403));
  return next();
};

const enforceBranchAccess = async (req, res, next) => {
  try {
    if (!req.user?.activeBranchId) return next(new AppError("Branch context is required", 400));
    const allowed = (req.user.branchIds || []).map((id) => id.toString());
    if (req.user.role !== "owner" && !allowed.includes(req.user.activeBranchId.toString())) {
      return next(new AppError("You do not have access to this branch", 403));
    }
    const branch = await Branch.findOne({
      _id: req.user.activeBranchId,
      restaurantId: req.user.restaurantId,
      isDeleted: false,
      status: "active"
    });
    if (!branch) return next(new AppError("Branch does not belong to this restaurant", 403));
    req.branch = branch;
    return next();
  } catch (error) {
    return next(error);
  }
};

const validateBranchTenant = async (req, res, next) => {
  try {
    if (!req.user?.activeBranchId) return next(new AppError("Branch context is required", 400));
    const branch = await Branch.findOne({
      _id: req.user.activeBranchId,
      restaurantId: req.user.restaurantId,
      isDeleted: false,
      status: "active"
    });
    if (!branch) return next(new AppError("Branch does not belong to this restaurant", 403));
    req.branch = branch;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { authenticate, authorize, enforceBranchAccess, validateBranchTenant };
