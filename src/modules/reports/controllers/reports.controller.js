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

const { toCSV, toSectionsCSV } = require("../../../utils/csvExport");
const { toXLSXBuffer, toXLSXSectionsBuffer } = require("../../../utils/xlsxExport");
const { toPDFBuffer, toPDFSectionsBuffer } = require("../../../utils/pdfExport");
const { toSections } = require("../../../utils/reportSections");

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const EXPORTERS = {
  csv: { contentType: "text/csv", build: (rows) => toCSV(rows) },
  xlsx: { contentType: XLSX_CONTENT_TYPE, build: (rows, filename) => toXLSXBuffer(rows, filename) },
  pdf: { contentType: "application/pdf", build: (rows, filename) => toPDFBuffer(rows, filename) },
};

// For aggregate/summary reports (nested objects, not a flat record list): each
// group is rendered as its own table/sheet section instead of one flat table.
const SECTION_EXPORTERS = {
  csv: { contentType: "text/csv", build: (sections) => toSectionsCSV(sections) },
  xlsx: { contentType: XLSX_CONTENT_TYPE, build: (sections, filename) => toXLSXSectionsBuffer(sections, filename) },
  pdf: { contentType: "application/pdf", build: (sections, filename) => toPDFSectionsBuffer(sections, filename) },
};

const _exportReport = async (res, data, filename, format) => {
  const exporter = EXPORTERS[format];
  const rows = Array.isArray(data) ? data : data.records || [data];
  const output = await exporter.build(rows, filename);
  res.setHeader("Content-Type", exporter.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.${format}"`);
  return res.send(output);
};

const _exportSections = async (res, data, filename, format) => {
  const exporter = SECTION_EXPORTERS[format];
  const output = await exporter.build(toSections(data), filename);
  res.setHeader("Content-Type", exporter.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.${format}"`);
  return res.send(output);
};

const salesReport = asyncHandler(async (req, res) => {
  const data = await reportsService.salesReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "sales-report", req.query.export);
  sendSuccess(res, { message: "Sales report", data });
});

const ordersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.ordersReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "orders-report", req.query.export);
  sendSuccess(res, { message: "Orders report", data });
});

const topSellingItemsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.topSellingItemsReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "top-selling-items", req.query.export);
  sendSuccess(res, { message: "Top selling items report", data });
});

const leastSellingItemsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.leastSellingItemsReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "least-selling-items", req.query.export);
  sendSuccess(res, { message: "Least selling items report", data });
});

const staffPerformanceReport = asyncHandler(async (req, res) => {
  const data = await reportsService.staffPerformanceReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "staff-performance", req.query.export);
  sendSuccess(res, { message: "Staff performance report", data });
});

const customersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.customersReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "customers-report", req.query.export);
  sendSuccess(res, { message: "Customers report", data });
});

const taxDetailReport = asyncHandler(async (req, res) => {
  const data = await reportsService.taxDetailReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportSections(res, data, "tax-report", req.query.export);
  sendSuccess(res, { message: "Tax report", data });
});

const branchesReport = asyncHandler(async (req, res) => {
  const data = await reportsService.branchesReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "branches-report", req.query.export);
  sendSuccess(res, { message: "Branches report", data });
});

const auditLogsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.auditLogsReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data, "audit-logs", req.query.export);
  sendSuccess(res, { message: "Audit logs", data });
});

const inventoryReport = asyncHandler(async (req, res) => {
  const data = await reportsService.inventoryReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportSections(res, data, "inventory-report", req.query.export);
  sendSuccess(res, { message: "Inventory report", data });
});

const expensesDetailReport = asyncHandler(async (req, res) => {
  const data = await reportsService.expensesDetailReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportReport(res, data.records || [], "expenses-report", req.query.export);
  sendSuccess(res, { message: "Expenses report", data });
});

const profitLossReport = asyncHandler(async (req, res) => {
  const data = await reportsService.profitLossReport({ query: req.query, tenant: req.tenant });
  if (req.query.export) return _exportSections(res, data, "profit-loss-report", req.query.export);
  sendSuccess(res, { message: "Profit & loss report", data });
});

// ── POST-based report controllers ─────────────────────────────────────────────

// Sales
const salesReportPost = asyncHandler(async (req, res) => {
  const data = await reportsService.salesReportPost({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "sales-report", req.body.export);
  sendSuccess(res, { message: "Sales report", data });
});

const salesSummaryReport = asyncHandler(async (req, res) => {
  const data = await reportsService.salesSummaryReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportSections(res, data, "sales-summary", req.body.export);
  sendSuccess(res, { message: "Sales summary report", data });
});

const revenueReport = asyncHandler(async (req, res) => {
  const data = await reportsService.revenueReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportSections(res, data, "revenue-report", req.body.export);
  sendSuccess(res, { message: "Revenue report", data });
});

const hourlySalesReport = asyncHandler(async (req, res) => {
  const data = await reportsService.hourlySalesReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportSections(res, data, "hourly-sales", req.body.export);
  sendSuccess(res, { message: "Hourly sales report", data });
});

const topItemsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.topItemsReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "top-items", req.body.export);
  sendSuccess(res, { message: "Top selling items report", data });
});

const salesByCategoryReport = asyncHandler(async (req, res) => {
  const data = await reportsService.salesByCategoryReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "sales-by-category", req.body.export);
  sendSuccess(res, { message: "Sales by category report", data });
});

// Inventory
const inventoryStockReport = asyncHandler(async (req, res) => {
  const data = await reportsService.inventoryStockReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "inventory-stock", req.body.export);
  sendSuccess(res, { message: "Inventory stock report", data });
});

const lowStockReport = asyncHandler(async (req, res) => {
  const data = await reportsService.lowStockReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "low-stock", req.body.export);
  sendSuccess(res, { message: "Low stock report", data });
});

const suppliersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.suppliersReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "suppliers", req.body.export);
  sendSuccess(res, { message: "Suppliers report", data });
});

const inventoryUsageReport = asyncHandler(async (req, res) => {
  const data = await reportsService.inventoryUsageReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "inventory-usage", req.body.export);
  sendSuccess(res, { message: "Inventory usage report", data });
});

const purchaseOrdersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.purchaseOrdersReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "purchase-orders", req.body.export);
  sendSuccess(res, { message: "Purchase orders report", data });
});

// Orders
const ordersReportPost = asyncHandler(async (req, res) => {
  const data = await reportsService.ordersReportPost({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "orders-report", req.body.export);
  sendSuccess(res, { message: "Orders report", data });
});

const kotReportPost = asyncHandler(async (req, res) => {
  const data = await reportsService.kotReportPost({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "kot-report", req.body.export);
  sendSuccess(res, { message: "KOT report", data });
});

const cancelledOrdersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.cancelledOrdersReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "cancelled-orders", req.body.export);
  sendSuccess(res, { message: "Cancelled orders report", data });
});

const tableOccupancyReport = asyncHandler(async (req, res) => {
  const data = await reportsService.tableOccupancyReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "table-occupancy", req.body.export);
  sendSuccess(res, { message: "Table occupancy report", data });
});

const qrOrdersReport = asyncHandler(async (req, res) => {
  const data = await reportsService.qrOrdersReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "qr-orders", req.body.export);
  sendSuccess(res, { message: "QR orders report", data });
});

// Staff
const staffDirectoryReport = asyncHandler(async (req, res) => {
  const data = await reportsService.staffDirectoryReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "staff-directory", req.body.export);
  sendSuccess(res, { message: "Staff directory report", data });
});

const attendanceReport = asyncHandler(async (req, res) => {
  const data = await reportsService.attendanceReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "attendance", req.body.export);
  sendSuccess(res, { message: "Attendance report", data });
});

const departmentReport = asyncHandler(async (req, res) => {
  const data = await reportsService.departmentReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "department-report", req.body.export);
  sendSuccess(res, { message: "Department report", data });
});

const shiftsReport = asyncHandler(async (req, res) => {
  const data = await reportsService.shiftsReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "shifts-report", req.body.export);
  sendSuccess(res, { message: "Shifts report", data });
});

// Financial
const expensesReportPost = asyncHandler(async (req, res) => {
  const data = await reportsService.expensesReportPost({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "expenses-report", req.body.export);
  sendSuccess(res, { message: "Expenses report", data });
});

const profitLossReportPost = asyncHandler(async (req, res) => {
  const data = await reportsService.profitLossReportPost({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportSections(res, data, "profit-loss-report", req.body.export);
  sendSuccess(res, { message: "Profit & loss report", data });
});

const billSettlementReport = asyncHandler(async (req, res) => {
  const data = await reportsService.billSettlementReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportReport(res, data.records, "bill-settlement", req.body.export);
  sendSuccess(res, { message: "Bill settlement report", data });
});

const taxSummaryReport = asyncHandler(async (req, res) => {
  const data = await reportsService.taxSummaryReport({ body: req.body, tenant: req.tenant });
  if (req.body.export) return _exportSections(res, data, "tax-summary", req.body.export);
  sendSuccess(res, { message: "Tax summary report", data });
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
  // POST-based
  salesReportPost,
  salesSummaryReport,
  revenueReport,
  hourlySalesReport,
  topItemsReport,
  salesByCategoryReport,
  inventoryStockReport,
  lowStockReport,
  suppliersReport,
  inventoryUsageReport,
  purchaseOrdersReport,
  ordersReportPost,
  kotReportPost,
  cancelledOrdersReport,
  tableOccupancyReport,
  qrOrdersReport,
  staffDirectoryReport,
  attendanceReport,
  departmentReport,
  shiftsReport,
  expensesReportPost,
  profitLossReportPost,
  billSettlementReport,
  taxSummaryReport,
};
