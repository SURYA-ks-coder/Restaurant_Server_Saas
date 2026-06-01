const express = require("express");
const controller = require("./controllers/auth.controller");
const validate = require("../../middleware/validate.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const validator = require("./validators/auth.validator");

const router = express.Router();

router.post("/register", validate(validator.register), controller.register);
router.post("/login", validate(validator.login), controller.login);
router.post("/refresh-token", validate(validator.refresh), controller.refresh);
router.post("/forgot-password", validate(validator.forgotPassword), controller.forgotPassword);
router.post("/reset-password", validate(validator.resetPassword), controller.resetPassword);
router.post("/logout", authenticate, controller.logout);
router.post("/change-password", authenticate, validate(validator.changePassword), controller.changePassword);
router.get("/me", authenticate, controller.me);

module.exports = router;
