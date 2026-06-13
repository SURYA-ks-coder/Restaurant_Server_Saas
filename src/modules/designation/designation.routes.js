const express = require("express");
const controller = require("./controllers/designation.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const validator = require("./validators/designation.validator");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/list", authorize("designation:read"), validate(validator.list), controller.list);
router.get("/getDesignationById/:id", authorize("designation:read"), validate(validator.idParam), controller.get);
router.post("/", authorize("designation:create"), validate(validator.create), controller.create);
router.patch("/updateDesignation/:id", authorize("designation:update"), validate(validator.update), controller.update);
router.delete("/:id", authorize("designation:delete"), validate(validator.idParam), controller.remove);

module.exports = router;
