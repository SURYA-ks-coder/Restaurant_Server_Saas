const express = require("express");
const controller = require("./controllers/subcategory.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/subcategory.validator");

const router = express.Router();

router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("subcategory:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getSubCategoryById/:id",
  authorize("subcategory:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("subcategory:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateSubCategory/:id",
  authorize("subcategory:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/deleteSubCategory/:id",
  authorize("subcategory:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
