const express = require("express");
const controller = require("./controllers/wastage.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/wastage.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/", authorize("inventory:read"), validate(validator.list), controller.list);
router.get("/report", authorize("inventory:read"), validate(validator.report), controller.report);
router.get("/:id", authorize("inventory:read"), validate(validator.idParam), controller.get);
router.post("/", authorize("inventory:create"), validate(validator.record), controller.record);

module.exports = router;
