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
    const user = await User.findOne({
      _id: payload.sub,
      status: "active",
      isDeleted: false,
    })
      .select("+passwordChangedAt")
      .populate("roleId", "roleName")
      .lean();
    if (!user) throw new AppError("User no longer exists or is inactive", 401);
    const tokenTenantId = payload.tenantId || payload.restaurantId;
    if (tokenTenantId && String(tokenTenantId) !== String(user.restaurantId)) {
      throw new AppError("JWT tenant claim does not match user tenant", 401);
    }

    // Priority: new JWT roleName → old JWT role → DB populated roleId → legacy MongoDB field
    const roleName =
      payload.roleName ||
      payload.role ||
      user.roleId?.roleName ||
      user.role ||
      null;

    // userType: "platform_owner" | "restaurant_owner" | "staff"
    const userType = user.userType || payload.userType || "staff";

    // restaurantId always comes from the token's user; a mismatching query value
    // is a client bug — fail loudly instead of silently returning other data.
    if (
      req.query?.restaurantId &&
      userType !== "platform_owner" &&
      String(req.query.restaurantId) !== String(user.restaurantId)
    ) {
      throw new AppError("restaurantId does not match the authenticated account", 403);
    }

    // Branch context priority: x-branch-id header → branchId query param → default branch.
    // enforceBranchAccess still validates the user can access the requested branch.
    const requestedBranchId = req.headers["x-branch-id"] || req.query?.branchId;
    if (requestedBranchId && !/^[0-9a-fA-F]{24}$/.test(String(requestedBranchId))) {
      throw new AppError("Invalid branchId", 400);
    }

    req.user = {
      id: user._id,
      name: user.name,
      profileImage: user.profileImage || null,
      restaurantId: user.restaurantId,
      branchIds: user.branchIds,
      activeBranchId: requestedBranchId || user.defaultBranchId,
      roleId: user.roleId?._id || null,
      roleName,
      userType,
      permissions: user.permissions,
      email: user.email,
    };
    next();
  } catch (error) {
    next(
      error.statusCode ? error : new AppError("Invalid or expired token", 401),
    );
  }
};

// platform_owner and restaurant_owner bypass permission checks.
// Staff must have the required permission strings in their permissions array.
const authorize =
  (...requiredPermissions) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError("Authentication required", 401));
    if (req.user.userType === "platform_owner" || req.user.userType === "restaurant_owner")
      return next();
    const permissions = req.user.permissions || [];
    const allowed = requiredPermissions.every((p) => permissions.includes(p));
    if (!allowed)
      return next(
        new AppError("You do not have permission to access this resource", 403),
      );
    return next();
  };

// Restricts access to platform_owner only.
// Restaurant owners and staff are blocked.
const requireProductOwner = (req, res, next) => {
  if (!req.user) return next(new AppError("Authentication required", 401));
  if (req.user.userType === "platform_owner") return next();
  return next(
    new AppError("This resource is restricted to platform administrators", 403),
  );
};

const enforceBranchAccess = async (req, res, next) => {
  try {
    if (!req.user?.activeBranchId)
      return next(new AppError("Branch context is required", 400));
    const allowed = (req.user.branchIds || []).map((id) => id.toString());
    if (
      req.user.userType === "staff" &&
      !allowed.includes(req.user.activeBranchId.toString())
    ) {
      return next(new AppError("You do not have access to this branch", 403));
    }
    const branch = await Branch.findOne({
      _id: req.user.activeBranchId,
      restaurantId: req.user.restaurantId,
      isDeleted: false,
      status: "active",
    });
    if (!branch)
      return next(
        new AppError("Branch does not belong to this restaurant", 403),
      );
    req.branch = branch;
    return next();
  } catch (error) {
    return next(error);
  }
};

const validateBranchTenant = async (req, res, next) => {
  try {
    if (!req.user?.activeBranchId)
      return next(new AppError("Branch context is required", 400));
    const branch = await Branch.findOne({
      _id: req.user.activeBranchId,
      restaurantId: req.user.restaurantId,
      isDeleted: false,
      status: "active",
    });
    if (!branch)
      return next(
        new AppError("Branch does not belong to this restaurant", 403),
      );
    req.branch = branch;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  requireProductOwner,
  enforceBranchAccess,
  validateBranchTenant,
};
