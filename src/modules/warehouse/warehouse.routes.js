const express = require("express");
const controller = require("./controllers/warehouse.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/warehouse.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/", authorize("inventory:read"), validate(validator.list), controller.list);
router.get("/:id", authorize("inventory:read"), validate(validator.idParam), controller.get);
router.post("/", authorize("inventory:create"), validate(validator.create), controller.create);
router.patch("/:id", authorize("inventory:update"), validate(validator.update), controller.update);
router.delete("/:id", authorize("inventory:delete"), validate(validator.idParam), controller.remove);

module.exports = router;
