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

const { toCSV } = require("../../../utils/csvExport");

const _csvOrJson = (res, data, filename) => {
  const rows = Array.isArray(data) ? data : data.records || [data];
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  return res.send(toCSV(rows));
};

const salesReport = asyncHandler(async (req, res) => {
  const data = await reportsService.salesReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "sales-report");
  sendSuccess(res, { message: "Sales report", data });
});

const ordersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.ordersReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "orders-report");
  sendSuccess(res, { message: "Orders report", data });
});

const topSellingItemsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.topSellingItemsReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "top-selling-items");
  sendSuccess(res, { message: "Top selling items report", data });
});

const leastSellingItemsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.leastSellingItemsReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "least-selling-items");
  sendSuccess(res, { message: "Least selling items report", data });
});

const staffPerformanceReport = asyncHandler(async (req, res) => {
  const data = await reportsService.staffPerformanceReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "staff-performance");
  sendSuccess(res, { message: "Staff performance report", data });
});

const customersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.customersReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "customers-report");
  sendSuccess(res, { message: "Customers report", data });
});

const taxDetailReport = asyncHandler(async (req, res) => {
  const data = await reportsService.taxDetailReport({ query: req.query, tenant: req.tenant });
  sendSuccess(res, { message: "Tax report", data });
});

const branchesReport = asyncHandler(async (req, res) => {
  const data = await reportsService.branchesReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "branches-report");
  sendSuccess(res, { message: "Branches report", data });
});

const auditLogsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.auditLogsReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data, "audit-logs");
  sendSuccess(res, { message: "Audit logs", data });
});

const inventoryReport = asyncHandler(async (req, res) => {
  const data = await reportsService.inventoryReport({ query: req.query, tenant: req.tenant });
  sendSuccess(res, { message: "Inventory report", data });
});

const expensesDetailReport = asyncHandler(async (req, res) => {
  const data = await reportsService.expensesDetailReport({ query: req.query, tenant: req.tenant });
  if (req.query.export === "csv") return _csvOrJson(res, data.records || [], "expenses-report");
  sendSuccess(res, { message: "Expenses report", data });
});

const profitLossReport = asyncHandler(async (req, res) => {
  const data = await reportsService.profitLossReport({ query: req.query, tenant: req.tenant });
  sendSuccess(res, { message: "Profit & loss report", data });
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
  // new
  salesReport,
  ordersReport,
  topSellingItemsReport,
  leastSellingItemsReport,
  staffPerformanceReport,
  customersReport,
  taxDetailReport,
  branchesReport,
  auditLogsReport,
  inventoryReport,
  expensesDetailReport,
  profitLossReport,
};
