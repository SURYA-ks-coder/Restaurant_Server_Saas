const express = require("express");
const controller = require("./controllers/purchase.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/purchase.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/", authorize("inventory:read"), validate(validator.list), controller.list);
router.get("/summary", authorize("inventory:read"), controller.summary);
router.get("/:id", authorize("inventory:read"), validate(validator.idParam), controller.get);
router.post("/", authorize("inventory:create"), validate(validator.create), controller.create);
router.patch("/:id/cancel", authorize("inventory:update"), validate(validator.cancel), controller.cancel);

module.exports = router;
