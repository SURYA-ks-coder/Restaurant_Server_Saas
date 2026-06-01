const express = require("express");
const controller = require("./controllers/category.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const { uploadImage } = require("../../middleware/upload.middleware");
const validator = require("./validators/category.validator");

const router = express.Router();

router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("category:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getCategoryById/:id",
  authorize("category:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("category:create"),
  uploadImage.single("image"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateCategory/:id",
  authorize("category:update"),
  uploadImage.single("image"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/deleteCategory/:id",
  authorize("category:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
