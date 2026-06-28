const express = require("express");
const controller = require("./controllers/subscription.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate, authorize, requireProductOwner } = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/subscription.validator");

const router = express.Router();

router.get("/list", validate(validator.listPlans), controller.listPlans);

router.use(authenticate, attachTenantScope);

// Restaurant Owner (roleLevel 2) and above can view and manage their own subscription
router.get("/current", authorize("subscription:read"), controller.current);
router.post(
  "/select-plan",
  authorize("subscription:manage"),
  validate(validator.selectPlan),
  controller.selectPlan,
);
router.post(
  "/upgrade",
  authorize("subscription:manage"),
  validate(validator.selectPlan),
  controller.selectPlan,
);
router.post(
  "/downgrade",
  authorize("subscription:manage"),
  validate(validator.selectPlan),
  controller.selectPlan,
);

// Product Owner (roleLevel 1) only — platform-level subscription management
router.post("/expire", requireProductOwner, controller.expire);
router.post(
  "/plans",
  requireProductOwner,
  validate(validator.createPlan),
  controller.createPlan,
);
router.patch(
  "/plans/:id",
  requireProductOwner,
  validate(validator.updatePlan),
  controller.updatePlan,
);

module.exports = router;
