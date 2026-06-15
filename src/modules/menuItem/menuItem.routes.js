const express = require("express");
const controller = require("./controllers/menuItem.controller");
const validate = require("../../middleware/validate.middleware");
const {
  authenticate,
  authorize,
  enforceBranchAccess,
} = require("../../middleware/auth.middleware");
const attachTenantScope = require("../../middleware/tenantScope.middleware");
const { menuItemUpload } = require("../../middleware/upload.middleware");
const validator = require("./validators/menuItem.validator");

const router = express.Router();

router.post(
  "/list",
  // authorize("menu:read"),
  // validate(validator.list),
  controller.list,
);
router.use(authenticate, enforceBranchAccess, attachTenantScope);
router.get("/low-stock", authorize("menu:read"), controller.lowStock);
router.get(
  "/getMenuItemById/:id",
  authorize("menu:read"),
  validate(validator.idParam),
  controller.get,
);
router.post(
  "/",
  authorize("menu:create"),
  menuItemUpload.single("image"),
  validate(validator.create),
  controller.create,
);
router.patch(
  "/updateMenuItem/:id",
  authorize("menu:update"),
  menuItemUpload.single("image"),
  validate(validator.update),
  controller.update,
);
router.patch(
  "/:id/availability",
  authorize("menu:update"),
  validate(validator.availability),
  controller.availability,
);
router.patch(
  "/:id/prices",
  authorize("menu:update"),
  validate(validator.prices),
  controller.prices,
);
router.delete(
  "/deleteMenuItem/:id",
  authorize("menu:delete"),
  validate(validator.idParam),
  controller.remove,
);

module.exports = router;
