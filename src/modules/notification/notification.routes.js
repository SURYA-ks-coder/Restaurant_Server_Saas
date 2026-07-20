const express = require("express");
const controller = require("./controllers/notification.controller");
const {
  authenticate,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");

const router = express.Router();
router.use(authenticate, enforceBranchAccess, attachTenantScope);

router.get("/", controller.list);
router.patch("/read", controller.markAllRead);

module.exports = router;
