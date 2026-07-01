const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

const signAccessToken = (user, roleName) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.restaurantId?.toString(),
      restaurantId: user.restaurantId?.toString(),
      branchIds: (user.branchIds || []).map((id) => id.toString()),
      roleId: user.roleId?.toString() || null,
      roleName: roleName || null,
      userType: user.userType || "staff",
      permissions: user.permissions || [],
    },
    env.jwt.accessSecret,
    // { expiresIn: env.jwt.accessExpiresIn },
  );

const signRefreshToken = (user, tokenVersion) =>
  jwt.sign(
    { sub: user._id.toString(), tokenVersion },
    env.jwt.refreshSecret,
    // { expiresIn: env.jwt.refreshExpiresIn }
  );

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createPasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  };
};

const signQrToken = ({ restaurantId, branchId, tableId, tableNumber }) =>
  jwt.sign(
    { restaurantId: String(restaurantId), branchId: String(branchId), tableId: String(tableId), tableNumber },
    env.jwt.qrSecret,
  );

const verifyQrToken = (token) => jwt.verify(token, env.jwt.qrSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashToken,
  createPasswordResetToken,
  signQrToken,
  verifyQrToken,
};
