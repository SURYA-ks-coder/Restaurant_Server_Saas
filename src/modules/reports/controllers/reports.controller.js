const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const reportsService = require("../services/reports.service");

const dailySales = asyncHandler(async (req, res) => {
  const data = await reportsService.dailySales({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Daily sales report", data });
});

const monthlySales = asyncHandler(async (req, res) => {
  const data = await reportsService.monthlySales({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Monthly sales report", data });
});

const profitReport = asyncHandler(async (req, res) => {
  const data = await reportsService.profitReport({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Profit report", data });
});

const expenseReport = asyncHandler(async (req, res) => {
  const data = await reportsService.expenseReport({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Expense report", data });
});

const itemSales = asyncHandler(async (req, res) => {
  const data = await reportsService.itemSales({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Item sales report", data });
});

const taxReport = asyncHandler(async (req, res) => {
  const data = await reportsService.taxReport({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Tax report", data });
});

const kotReport = asyncHandler(async (req, res) => {
  const data = await reportsService.kotReport({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "KOT report", data });
});

const dashboardSummary = asyncHandler(async (req, res) => {
  const data = await reportsService.dashboardSummary({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Dashboard summary", data });
});

const topSellingItems = asyncHandler(async (req, res) => {
  const data = await reportsService.topSellingItems({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Top selling items", data });
});

const peakHours = asyncHandler(async (req, res) => {
  const data = await reportsService.peakHours({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Peak hours", data });
});

const revenueAnalytics = asyncHandler(async (req, res) => {
  const data = await reportsService.revenueAnalytics({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Revenue analytics", data });
});

const expenseAnalytics = asyncHandler(async (req, res) => {
  const data = await reportsService.expenseAnalytics({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Expense analytics", data });
});

module.exports = {
  dailySales,
  monthlySales,
  profitReport,
  expenseReport,
  itemSales,
  taxReport,
  kotReport,
  dashboardSummary,
  topSellingItems,
  peakHours,
  revenueAnalytics,
  expenseAnalytics,
};
