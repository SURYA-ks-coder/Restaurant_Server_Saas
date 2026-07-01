const express = require("express");
const controller = require("./controllers/qrOrder.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/qrOrder.validator");

const router = express.Router();

// Public — verifies the signed QR token and returns the table context
router.get("/resolve", controller.resolveToken);

router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/",
  authorize("qrOrder:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/:id",
  authorize("qrOrder:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("qrOrder:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/:id/cart",
  authorize("qrOrder:update"),
  validate(validator.updateCart),
  controller.updateCart,
);
router.post("/:id/place", authorize("qrOrder:update"), controller.placeOrder);
router.post(
  "/:id/payment",
  authorize("qrOrder:update"),
  validate(validator.payment),
  controller.recordPayment,
);
router.post("/:id/cancel", authorize("qrOrder:update"), controller.cancelOrder);

module.exports = router;
