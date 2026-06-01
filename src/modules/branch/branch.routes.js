const express = require("express");
const controller = require("./controllers/branch.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate, authorize } = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const {
  enforcePlanLimit,
} = require("../../middleware/subscription.middleware");
const validator = require("./validators/branch.validator");

const router = express.Router();

router.use(authenticate, attachTenantScope);

router.get(
  "/list",
  authorize("branch:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getBranchById/:id",
  authorize("branch:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("branch:create"),
  enforcePlanLimit("branches"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/UpdateBranch/:id",
  authorize("branch:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/:id",
  authorize("branch:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
