const express = require("express");
const controller = require("./controllers/reports.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/reports.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/dashboard",
  authorize("reports:read"),
  validate(validator.dashboardRange),
  controller.dashboardSummary,
);
router.get(
  "/dashboard/top-items",
  authorize("reports:read"),
  validate(validator.dashboardRange),
  controller.topSellingItems,
);
router.get(
  "/dashboard/peak-hours",
  authorize("reports:read"),
  validate(validator.dashboardRange),
  controller.peakHours,
);
router.get(
  "/dashboard/revenue",
  authorize("reports:read"),
  validate(validator.dashboardRange),
  controller.revenueAnalytics,
);
router.get(
  "/dashboard/expenses",
  authorize("reports:read"),
  validate(validator.dashboardRange),
  controller.expenseAnalytics,
);
router.get(
  "/daily-sales",
  authorize("reports:read"),
  validate(validator.range),
  controller.dailySales,
);
router.get(
  "/monthly-sales",
  authorize("reports:read"),
  validate(validator.range),
  controller.monthlySales,
);
router.get(
  "/profit",
  authorize("reports:read"),
  validate(validator.range),
  controller.profitReport,
);
router.get(
  "/expense",
  authorize("reports:read"),
  validate(validator.range),
  controller.expenseReport,
);
router.get(
  "/item-sales",
  authorize("reports:read"),
  validate(validator.range),
  controller.itemSales,
);
router.get(
  "/tax",
  authorize("reports:read"),
  validate(validator.range),
  controller.taxReport,
);
router.get(
  "/kot",
  authorize("reports:read"),
  validate(validator.range),
  controller.kotReport,
);

// ── New Report Routes ─────────────────────────────────────────────────────────
router.get(
  "/sales",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.salesReport,
);
router.get(
  "/orders",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.ordersReport,
);
router.get(
  "/items/top-selling",
  authorize("reports:read"),
  validate(validator.itemsQuery),
  controller.topSellingItemsReport,
);
router.get(
  "/items/least-selling",
  authorize("reports:read"),
  validate(validator.itemsQuery),
  controller.leastSellingItemsReport,
);
router.get(
  "/staff-performance",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.staffPerformanceReport,
);
router.get(
  "/customers",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.customersReport,
);
router.get(
  "/tax-detail",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.taxDetailReport,
);
router.get(
  "/branches",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.branchesReport,
);
router.get(
  "/audit-logs",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.auditLogsReport,
);

// ── Full Report Endpoints (GET) ───────────────────────────────────────────────
router.get(
  "/inventory",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.inventoryReport,
);
router.get(
  "/expenses",
  authorize("reports:read"),
  validate(validator.expensesQuery),
  controller.expensesDetailReport,
);
router.get(
  "/profit-loss",
  authorize("reports:read"),
  validate(validator.reportQuery),
  controller.profitLossReport,
);

// ═══════════════════════════════════════════════════════════════════════════════
// POST REPORT ENDPOINTS
// Body: { branchId, startDate, endDate, groupBy, page, limit, export, ...filters }
// ═══════════════════════════════════════════════════════════════════════════════

// Sales Reports
router.post(
  "/sales",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.salesReportPost,
);
router.post(
  "/sales/summary",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.salesSummaryReport,
);
router.post(
  "/sales/revenue",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.revenueReport,
);
router.post(
  "/sales/hourly",
  authorize("reports:read"),
  validate(validator.hourlyBody),
  controller.hourlySalesReport,
);
router.post(
  "/top-selling-items",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.topItemsReport,
);
router.post(
  "/sales/category",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.salesByCategoryReport,
);

// Inventory Reports
router.post(
  "/inventory",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.inventoryStockReport,
);
router.post(
  "/inventory/low-stock",
  authorize("reports:read"),
  validate(validator.branchOnlyBody),
  controller.lowStockReport,
);
router.post(
  "/inventory/suppliers",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.suppliersReport,
);
router.post(
  "/inventory/usage",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.inventoryUsageReport,
);
router.post(
  "/inventory/purchase-orders",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.purchaseOrdersReport,
);

// Order Reports
router.post(
  "/orders",
  authorize("reports:read"),
  validate(validator.orderBody),
  controller.ordersReportPost,
);
router.post(
  "/orders/cancelled",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.cancelledOrdersReport,
);
router.post(
  "/kot",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.kotReportPost,
);
router.post(
  "/tables/occupancy",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.tableOccupancyReport,
);
router.post(
  "/qr-orders",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.qrOrdersReport,
);

// Staff Reports
router.post(
  "/staff",
  authorize("reports:read"),
  validate(validator.staffBody),
  controller.staffDirectoryReport,
);
router.post(
  "/staff/attendance",
  authorize("reports:read"),
  validate(validator.staffBody),
  controller.attendanceReport,
);
router.post(
  "/staff/department",
  authorize("reports:read"),
  validate(validator.staffBody),
  controller.departmentReport,
);
router.post(
  "/staff/shifts",
  authorize("reports:read"),
  validate(validator.staffBody),
  controller.shiftsReport,
);

// Financial Reports
router.post(
  "/expenses",
  authorize("reports:read"),
  validate(validator.expensesBody),
  controller.expensesReportPost,
);
router.post(
  "/financial/profit-loss",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.profitLossReportPost,
);
router.post(
  "/bills/settlement",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.billSettlementReport,
);
router.post(
  "/financial/tax",
  authorize("reports:read"),
  validate(validator.reportBody),
  controller.taxSummaryReport,
);

module.exports = router;
