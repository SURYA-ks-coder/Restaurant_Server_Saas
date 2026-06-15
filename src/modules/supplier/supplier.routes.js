const express = require("express");
const controller = require("./controllers/supplier.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const { supplierUpload } = require("../../middleware/upload.middleware");
const validator = require("./validators/supplier.validator");

const router = express.Router();

router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("supplier:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getSupplierById/:id",
  authorize("supplier:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("supplier:create"),
  supplierUpload.single("image"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateSupplier/:id",
  authorize("supplier:update"),
  supplierUpload.single("image"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/deleteSupplier/:id",
  authorize("supplier:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
