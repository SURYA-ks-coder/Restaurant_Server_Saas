const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const dashboardService = require("../services/dashboard.service");

const overview = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOverview({ tenant: req.tenant });
  sendSuccess(res, { message: "Dashboard overview", data });
});

const revenueSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRevenueSummary({ tenant: req.tenant });
  sendSuccess(res, { message: "Revenue summary", data });
});

const orderSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getOrderSummary({ tenant: req.tenant });
  sendSuccess(res, { message: "Order summary", data });
});

const tableSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTableSummary({ tenant: req.tenant });
  sendSuccess(res, { message: "Table summary", data });
});

const kitchenSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getKitchenSummary({ tenant: req.tenant });
  sendSuccess(res, { message: "Kitchen summary", data });
});

const topSellingItems = asyncHandler(async (req, res) => {
  const data = await dashboardService.getTopSellingItems({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Top selling items", data });
});

const recentActivities = asyncHandler(async (req, res) => {
  const data = await dashboardService.getRecentActivities({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Recent activities", data });
});

const customerSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCustomerSummary({ tenant: req.tenant });
  sendSuccess(res, { message: "Customer summary", data });
});

const branchPerformance = asyncHandler(async (req, res) => {
  const data = await dashboardService.getBranchPerformance({ tenant: req.tenant });
  sendSuccess(res, { message: "Branch performance", data });
});

module.exports = {
  overview,
  revenueSummary,
  orderSummary,
  tableSummary,
  kitchenSummary,
  topSellingItems,
  recentActivities,
  customerSummary,
  branchPerformance,
};
