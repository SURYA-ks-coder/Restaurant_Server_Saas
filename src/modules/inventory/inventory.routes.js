const express = require("express");
const controller = require("./controllers/inventory.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/inventory.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/",
  authorize("inventory:read"),
  validate(validator.list),
  controller.list,
);
router.get("/low-stock", authorize("inventory:read"), controller.lowStock);
router.get("/report", authorize("inventory:read"), controller.report);
router.get(
  "/:id",
  authorize("inventory:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("inventory:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/:id",
  authorize("inventory:update"),
  validate(validator.update),
  controller.update,
);
router.post(
  "/:id/stock/add",
  authorize("inventory:update"),
  validate(validator.adjustStock),
  controller.addStock,
);
router.post(
  "/:id/stock/remove",
  authorize("inventory:update"),
  validate(validator.adjustStock),
  controller.removeStock,
);
router.get(
  "/:id/history",
  authorize("inventory:read"),
  validate(validator.idParam),
  controller.history,
);

module.exports = router;
