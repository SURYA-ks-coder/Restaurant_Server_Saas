const express = require("express");
const controller = require("./controllers/shift.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/shift.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("shift:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getStaffShiftById/:id",
  authorize("shift:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("shift:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateStaffShift/:id",
  authorize("shift:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/deleteStaffShift/:id",
  authorize("shift:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
