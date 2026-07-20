const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const notificationService = require("../services/notification.service");

const list = asyncHandler(async (req, res) => {
  const data = await notificationService.listNotifications({
    tenant: req.tenant,
    query: req.query,
  });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Notifications fetched successfully",
    data,
  });
});

const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markAllRead({ tenant: req.tenant });
  sendSuccess(res, {
    statusCode: httpStatus.OK,
    message: "Notifications marked as read",
    data,
  });
});

module.exports = { list, markAllRead };
