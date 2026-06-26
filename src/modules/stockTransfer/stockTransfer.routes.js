const express = require("express");
const controller = require("./controllers/stockTransfer.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/stockTransfer.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/", authorize("inventory:read"), validate(validator.list), controller.list);
router.get("/:id", authorize("inventory:read"), validate(validator.idParam), controller.get);
router.post("/", authorize("inventory:create"), validate(validator.create), controller.create);
router.patch("/:id/approve", authorize("inventory:update"), validate(validator.idParam), controller.approve);
router.patch("/:id/complete", authorize("inventory:update"), validate(validator.idParam), controller.complete);
router.patch("/:id/reject", authorize("inventory:update"), validate(validator.reject), controller.reject);

module.exports = router;
