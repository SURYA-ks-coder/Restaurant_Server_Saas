const express = require("express");
const controller = require("./controllers/subscription.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate, authorize } = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/subscription.validator");

const router = express.Router();

router.get("/plans", validate(validator.listPlans), controller.listPlans);

router.use(authenticate, attachTenantScope);

router.get("/current", authorize("subscription:read"), controller.current);
router.post("/select-plan", authorize("subscription:manage"), validate(validator.selectPlan), controller.selectPlan);
router.post("/upgrade", authorize("subscription:manage"), validate(validator.selectPlan), controller.selectPlan);
router.post("/downgrade", authorize("subscription:manage"), validate(validator.selectPlan), controller.selectPlan);
router.post("/expire", authorize("subscription:manage"), controller.expire);
router.post("/plans", authorize("subscription:manage"), validate(validator.createPlan), controller.createPlan);
router.patch("/plans/:id", authorize("subscription:manage"), validate(validator.updatePlan), controller.updatePlan);

module.exports = router;
