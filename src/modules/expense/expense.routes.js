const express = require("express");
const controller = require("./controllers/expense.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/expense.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/",
  authorize("expense:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/:id",
  authorize("expense:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("expense:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/:id",
  authorize("expense:update"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/:id",
  authorize("expense:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
