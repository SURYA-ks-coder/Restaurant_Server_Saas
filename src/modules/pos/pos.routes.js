const express = require("express");
const controller = require("./controllers/pos.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/pos.validator");

const router = express.Router();

router.post(
  "/createQRorders",
  // authorize("pos:create"),
  // validate(validator.create),
  controller.create,
);

// Public — used by the unauthenticated QR customer menu app to poll status
router.post("/trackQRorder", controller.trackQrOrder);

// Public — table-side service request (call waiter / water / bill) from the
// unauthenticated QR customer menu app
router.post("/waiterAlert", controller.waiterAlert);

router.use(authenticate, enforceBranchAccess, attachTenantScope);
router.post(
  "/",
  authorize("pos:create"),
  validate(validator.create),
  controller.create,
);

router.get(
  "/list",
  authorize("pos:read"),
  validate(validator.list),
  controller.list,
);
router.post("/ordersBydate", authorize("pos:read"), controller.todayOrders);
router.get("/liveStatus", authorize("pos:read"), controller.liveStatus);

router.get(
  "/:id",
  authorize("pos:read"),
  validate(validator.idParam),
  controller.get,
);

router.patch(
  "/:id",
  authorize("pos:update"),
  validate(validator.update),
  controller.update,
);
router.post(
  "/:id/items",
  authorize("pos:update"),
  validate(validator.addItem),
  controller.addItem,
);
router.patch(
  "/:id/items/:itemId",
  authorize("pos:update"),
  validate(validator.updateItem),
  controller.updateItemQuantity,
);
router.delete(
  "/:id/items/:itemId",
  authorize("pos:update"),
  controller.removeItem,
);
router.patch(
  "/:id/discount",
  authorize("pos:update"),
  validate(validator.discount),
  controller.applyDiscount,
);
router.post(
  "/:id/payment",
  authorize("pos:update"),
  validate(validator.payment),
  controller.recordPayment,
);
router.post("/:id/hold", authorize("pos:update"), controller.holdOrder);
router.post("/:id/resume", authorize("pos:update"), controller.resumeOrder);
router.post("/:id/cancel", authorize("pos:update"), controller.cancelOrder);
router.get(
  "/:id/invoice",
  authorize("pos:read"),
  validate(validator.idParam),
  controller.generateInvoice,
);

module.exports = router;
