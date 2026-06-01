const express = require("express");
const controller = require("./controllers/tableReservation.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/tableReservation.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("reservation:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/:id",
  authorize("reservation:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("reservation:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/:id",
  authorize("reservation:update"),
  validate(validator.update),
  controller.update,
);
router.patch(
  "/:id/status",
  authorize("reservation:update"),
  validate(validator.status),
  controller.updateStatus,
);
router.delete(
  "/:id",
  authorize("reservation:delete"),
  validate(validator.idParam),
  controller.remove,
);
router.patch(
  "/:id/cancel",
  authorize("reservation:update"),
  validate(validator.cancel),
  controller.cancel,
);
router.patch(
  "/:id/seat",
  authorize("reservation:update"),
  validate(validator.idParam),
  controller.seat,
);
router.patch(
  "/:id/complete",
  authorize("reservation:update"),
  validate(validator.idParam),
  controller.complete,
);

module.exports = router;
