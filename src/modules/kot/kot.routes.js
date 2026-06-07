const express = require("express");
const controller = require("./controllers/kot.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/kot.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get(
  "/list",
  authorize("kot:read"),
  validate(validator.list),
  controller.list,
);
router.get(
  "/:id",
  authorize("kot:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("kot:create"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/KOTstatusUpdate",
  authorize("kot:update"),
  validate(validator.status),
  controller.updateStatus,
);
router.patch(
  "/updateItemStatus",
  authorize("kot:update"),
  validate(validator.itemStatus),
  controller.updateItemStatus,
);
router.patch(
  "/:id/priority",
  authorize("kot:update"),
  validate(validator.priority),
  controller.updatePriority,
);
router.patch("/:id/serve", authorize("kot:update"), controller.markServed);

module.exports = router;
