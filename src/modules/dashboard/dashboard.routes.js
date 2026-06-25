const express = require("express");
const controller = require("./controllers/dashboard.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/dashboard.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/overview", authorize("reports:read"), controller.overview);
router.get(
  "/revenue-summary",
  authorize("reports:read"),
  controller.revenueSummary,
);
router.get(
  "/hourlyRevenue",
  authorize("reports:read"),
  validate(validator.hourlyRevenue),
  controller.hourlyRevenue,
);
router.get(
  "/order-summary",
  authorize("reports:read"),
  controller.orderSummary,
);
router.get(
  "/table-summary",
  authorize("reports:read"),
  controller.tableSummary,
);
router.get(
  "/kitchen-summary",
  authorize("reports:read"),
  controller.kitchenSummary,
);
router.get(
  "/top-selling-items",
  authorize("reports:read"),
  validate(validator.topSelling),
  controller.topSellingItems,
);
router.get(
  "/recent-activities",
  authorize("reports:read"),
  validate(validator.recentActivities),
  controller.recentActivities,
);
router.get(
  "/customer-summary",
  authorize("reports:read"),
  controller.customerSummary,
);
router.get(
  "/branch-performance",
  authorize("reports:read"),
  controller.branchPerformance,
);

module.exports = router;
