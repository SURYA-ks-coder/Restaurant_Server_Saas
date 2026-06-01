const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.restaurantId?.toString(),
      restaurantId: user.restaurantId?.toString(),
      branchIds: (user.branchIds || []).map((id) => id.toString()),
      role: user.role,
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

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashToken,
  createPasswordResetToken,
};
