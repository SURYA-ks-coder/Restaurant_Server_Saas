const express = require("express");
const controller = require("./controllers/staff.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const {
  enforcePlanLimit,
} = require("../../middleware/subscription.middleware");
const { staffUpload } = require("../../middleware/upload.middleware");
const validator = require("./validators/staff.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("staff:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/my-team",
  authorize("staff:read"),
  controller.myTeam,
);
router.get(
  "/by-role/:roleId",
  authorize("staff:read"),
  validate(validator.listByRole),
  controller.listByRole,
);
router.get(
  "/getUserById/:id",
  authorize("staff:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("staff:create"),
  enforcePlanLimit("users"),
  staffUpload.single("profileImage"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/assignRole",
  authorize("staff:update"),
  validate(validator.assignRole),
  controller.assignRole,
);
router.patch(
  "/UpdateUser/:id",
  authorize("staff:update"),
  staffUpload.single("profileImage"),
  validate(validator.update),
  controller.update,
);
router.delete(
  "/deleteUser/:id",
  authorize("staff:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
