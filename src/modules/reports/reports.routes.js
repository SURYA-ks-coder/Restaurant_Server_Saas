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

module.exports = router;
