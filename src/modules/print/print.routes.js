const express = require("express");
const printerSettingsController = require("./controllers/printerSettings.controller");
const printController = require("./controllers/print.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const printerSettingsValidator = require("./validators/printerSettings.validator");
const printValidator = require("./validators/print.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/settings", authorize("print:read"), printerSettingsController.get);
router.put(
  "/settings",
  authorize("print:manage"),
  validate(printerSettingsValidator.updateSettings),
  printerSettingsController.update,
);
router.post(
  "/settings/printers",
  authorize("print:manage"),
  validate(printerSettingsValidator.addPrinter),
  printerSettingsController.addPrinter,
);
router.patch(
  "/settings/printers/:printerId",
  authorize("print:manage"),
  validate(printerSettingsValidator.updatePrinter),
  printerSettingsController.updatePrinter,
);
router.delete(
  "/settings/printers/:printerId",
  authorize("print:manage"),
  validate(printerSettingsValidator.printerIdParam),
  printerSettingsController.removePrinter,
);

// On-site print agent: key generation (shown once) + connection status
router.post(
  "/settings/agent-key",
  authorize("print:manage"),
  printerSettingsController.generateAgentKey,
);
router.get(
  "/agent/status",
  authorize("print:read"),
  printerSettingsController.getAgentStatus,
);

router.post(
  "/kot/:id",
  authorize("kot:read"),
  validate(printValidator.idParam),
  printController.printKot,
);
router.get(
  "/kot/:id/preview",
  authorize("kot:read"),
  validate(printValidator.idParam),
  printController.previewKot,
);

router.post(
  "/bill/:id",
  authorize("pos:read"),
  validate(printValidator.idParam),
  printController.printBill,
);
router.get(
  "/bill/:id/preview",
  authorize("pos:read"),
  validate(printValidator.idParam),
  printController.previewBill,
);

router.post(
  "/qr-order/:id",
  authorize("qrOrder:read"),
  validate(printValidator.idParam),
  printController.printQrOrder,
);
router.get(
  "/qr-order/:id/preview",
  authorize("qrOrder:read"),
  validate(printValidator.idParam),
  printController.previewQrOrder,
);

module.exports = router;
