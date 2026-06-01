const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendSuccess(res, {
    statusCode: 200,
    message: "Registered successfully",
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendSuccess(res, { message: "Logged in successfully", data });
});

const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  sendSuccess(res, { message: "Token refreshed", data });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  sendSuccess(res, { message: "Logged out successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  sendSuccess(res, { message: "Password reset instructions generated", data });
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, { message: "Password reset successfully" });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword({ userId: req.user.id, ...req.body });
  sendSuccess(res, { message: "Password changed successfully" });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: "Profile fetched", data: { user: req.user } });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
