const express = require("express");
const controller = require("./controllers/staff.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const {
  enforcePlanLimit,
} = require("../../middleware/subscription.middleware");
const validator = require("./validators/staff.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("staff:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/by-role/:roleId",
  authorize("staff:read"),
  validate(validator.listByRole),
  controller.listByRole,
);
router.get(
  "/:id",
  authorize("staff:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("staff:create"),
  enforcePlanLimit("users"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/assign-role",
  authorize("staff:update"),
  validate(validator.assignRole),
  controller.assignRole,
);
router.patch(
  "/:id",
  authorize("staff:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/:id",
  authorize("staff:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
