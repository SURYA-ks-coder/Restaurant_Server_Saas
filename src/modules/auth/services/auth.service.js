const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const env = require("../../../config/env");
const { signAccessToken, signRefreshToken, hashToken, createPasswordResetToken } = require("../../../utils/token");
const userRepository = require("../repositories/user.repository");

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  restaurantId: user.restaurantId,
  branchIds: user.branchIds,
  defaultBranchId: user.defaultBranchId,
  role: user.role,
  permissions: user.permissions,
  status: user.status
});

const issueTokens = async (user) => {
  const tokenVersion = (user.tokenVersion || 0) + 1;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, tokenVersion);
  user.refreshTokenHash = hashToken(refreshToken);
  user.tokenVersion = tokenVersion;
  user.lastLoginAt = new Date();
  await user.save();
  return { accessToken, refreshToken };
};

const register = async (payload) => {
  const exists = await userRepository.findOne({
    restaurantId: payload.restaurantId,
    email: payload.email,
    isDeleted: false
  });
  if (exists) throw new AppError("Email already registered for this restaurant", httpStatus.CONFLICT);

  const user = await userRepository.create(payload);
  const authUser = await userRepository.findByEmailForAuth(user.restaurantId, user.email);
  const tokens = await issueTokens(authUser);
  return { user: publicUser(authUser), tokens };
};

const login = async ({ restaurantId, email, password, branchId }) => {
  const user = await userRepository.findByEmailForAuth(restaurantId, email);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", httpStatus.UNAUTHORIZED);
  }
  if (user.status !== "active") throw new AppError("Account is not active", httpStatus.FORBIDDEN);
  if (branchId && !user.branchIds.map(String).includes(String(branchId)) && user.role !== "owner") {
    throw new AppError("User does not have access to selected branch", httpStatus.FORBIDDEN);
  }

  const tokens = await issueTokens(user);
  return { user: publicUser(user), tokens };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) throw new AppError("Refresh token is required", httpStatus.UNAUTHORIZED);
  const payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  const user = await userRepository.findByRefreshPayload(payload.sub);
  if (!user || user.refreshTokenHash !== hashToken(refreshToken) || user.tokenVersion !== payload.tokenVersion) {
    throw new AppError("Invalid refresh token", httpStatus.UNAUTHORIZED);
  }
  const tokens = await issueTokens(user);
  return { user: publicUser(user), tokens };
};

const logout = async (userId) => {
  const user = await userRepository.findByRefreshPayload(userId);
  if (user) {
    user.refreshTokenHash = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
  }
};

const forgotPassword = async ({ restaurantId, email }) => {
  const user = await userRepository.findByEmailForAuth(restaurantId, email);
  if (!user) return { resetToken: null };
  const reset = createPasswordResetToken();
  user.passwordResetTokenHash = reset.tokenHash;
  user.passwordResetExpiresAt = reset.expiresAt;
  await user.save();
  return { resetToken: reset.token, expiresAt: reset.expiresAt };
};

const resetPassword = async ({ token, password }) => {
  const user = await userRepository.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
    isDeleted: false
  }).select("+passwordResetTokenHash +passwordResetExpiresAt +password +tokenVersion");
  if (!user) throw new AppError("Invalid or expired reset token", httpStatus.BAD_REQUEST);
  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId).select("+password +tokenVersion");
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", httpStatus.BAD_REQUEST);
  }
  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, changePassword, publicUser };
