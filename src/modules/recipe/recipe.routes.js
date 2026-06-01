const express = require("express");
const controller = require("./controllers/recipe.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/recipe.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/",
  authorize("recipe:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/:id",
  authorize("recipe:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("recipe:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/:id",
  authorize("recipe:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/:id",
  authorize("recipe:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
