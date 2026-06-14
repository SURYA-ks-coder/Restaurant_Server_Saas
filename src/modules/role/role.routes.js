const express = require("express");
const controller = require("./controllers/role.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/role.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/menus", controller.getMenuList);
router.get(
  "/list",
  authorize("role:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getRoleById/:id",
  authorize("role:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("role:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateRole/:id",
  authorize("role:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/deleteRole/:id",
  authorize("role:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
