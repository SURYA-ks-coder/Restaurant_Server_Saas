const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const password = Joi.string().min(8).max(72);

const register = {
  body: Joi.object({
    restaurantId: objectId.required(),
    branchIds: Joi.array().items(objectId).min(1).required(),
    defaultBranchId: objectId.required(),
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(20).allow("", null),
    password: password.required(),
    // role: Joi.string()
    //   .valid("owner", "manager", "cashier", "chef", "waiter", "inventory_staff")
    //   .default("owner"),
    permissions: Joi.array().items(Joi.string()).default([]),
  }),
};

const login = {
  body: Joi.object({
    restaurantId: objectId.optional(),
    branchId: objectId.optional(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const refresh = { body: Joi.object({ refreshToken: Joi.string().required() }) };
const forgotPassword = {
  body: Joi.object({
    restaurantId: objectId.required(),
    email: Joi.string().email().required(),
  }),
};
const resetPassword = {
  body: Joi.object({
    token: Joi.string().required(),
    password: password.required(),
  }),
};
const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: password.required(),
  }),
};

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
};
