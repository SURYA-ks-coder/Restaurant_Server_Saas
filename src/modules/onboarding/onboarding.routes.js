const express = require("express");
const controller = require("./controllers/onboarding.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate, authorize } = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const { uploadImage } = require("../../middleware/upload.middleware");
const validator = require("./validators/onboarding.validator");

const router = express.Router();

router.post(
  "/domain/check",
  validate(validator.domainCheck),
  controller.checkDomain,
);
router.post(
  "/register",
  uploadImage.single("logo"),
  validate(validator.register),
  controller.register,
);

router.get("/list", authenticate, validate(validator.list), controller.list);
router.get(
  "/getRestaurantById/:id",
  authenticate,
  validate(validator.idParam),
  controller.get,
);
router.patch(
  "/update/:id",
  authenticate,
  uploadImage.single("logo"),
  validate(validator.update),
  controller.update,
);
router.patch(
  "/status/:id",
  authenticate,
  validate(validator.statusUpdate),
  controller.updateStatus,
);

router.use(authenticate, attachTenantScope);
router.patch(
  "/setup-wizard",
  authorize("restaurant:update"),
  uploadImage.single("logo"),
  validate(validator.setupWizard),
  controller.setupWizard,
);
router.post(
  "/logo",
  authorize("restaurant:update"),
  uploadImage.single("logo"),
  controller.uploadLogo,
);

module.exports = router;
