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

module.exports = router;
