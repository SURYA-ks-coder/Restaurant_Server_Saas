const express = require("express");
const controller = require("./controllers/table.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/table.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("table:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/active",
  authorize("table:read"),
  validate(validator.activeList),
  controller.activeList,
);
router.get(
  "/getTableById/:id",
  authorize("table:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("table:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateTable/:id",
  authorize("table:update"),
  validate(validator.update),
  controller.update,
);
router.patch(
  "/tableStatusUpdate",
  authorize("table:update"),
  validate(validator.status),
  controller.updateStatus,
);
router.patch("/:id/occupy", authorize("table:update"), controller.markOccupied);
router.patch("/:id/free", authorize("table:update"), controller.markFree);
router.post(
  "/generateQRCode/:id",
  authorize("table:update"),
  validate(validator.idParam),
  controller.generateQrCode,
);

module.exports = router;
