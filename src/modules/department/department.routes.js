const express = require("express");
const controller = require("./controllers/department.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/department.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("department:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/getDepartmentsById/:id",
  authorize("department:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("department:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateDepartment/:id",
  authorize("department:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/:id",
  authorize("department:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
