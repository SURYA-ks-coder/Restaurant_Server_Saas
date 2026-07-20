const express = require("express");
const controller = require("./controllers/customer.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/customer.validator");

const router = express.Router();

// Public — used by the unauthenticated QR customer menu app
router.post("/qr/profile", controller.qrProfile);

router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/",
  authorize("customer:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/:id",
  authorize("customer:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("customer:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/:id",
  authorize("customer:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/:id",
  authorize("customer:delete"),
  validate(validator.idParam),
  controller.remove,
);
router.get(
  "/:id/history",
  authorize("customer:read"),
  validate(validator.idParam),
  controller.history,
);

module.exports = router;
