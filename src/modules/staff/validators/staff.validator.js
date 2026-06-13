const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s]{7,20}$/);

const create = {
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    phone: phone.allow("", null),
    password: Joi.string().min(8).required(),
    role: Joi.string()
      .valid(
        "super_admin",
        "owner",
        "manager",
        "cashier",
        "chef",
        "waiter",
        "inventory_staff",
      )
      .required(),
    roleId: objectId.allow(null),
    permissions: Joi.array().items(Joi.string().trim()).default([]),
    branchIds: Joi.array().items(objectId).default([]),
    defaultBranchId: objectId.allow(null),
    status: Joi.string()
      .valid("active", "inactive", "blocked")
      .default("active"),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    name: Joi.string().min(2).max(120),
    email: Joi.string().email(),
    phone: phone.allow("", null),
    password: Joi.string().min(8),
    role: Joi.string().valid(
      "super_admin",
      "owner",
      "manager",
      "cashier",
      "chef",
      "waiter",
      "inventory_staff",
    ),
    roleId: objectId.allow(null),
    permissions: Joi.array().items(Joi.string().trim()),
    branchIds: Joi.array().items(objectId),
    defaultBranchId: objectId,
    status: Joi.string().valid("active", "inactive", "blocked"),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const listByRole = {
  params: Joi.object({ roleId: objectId.required() }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("active", "inactive", "blocked"),
    sortBy: Joi.string().valid("createdAt", "name", "email").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    status: Joi.string().valid("active", "inactive", "blocked"),
    role: Joi.string().valid(
      "super_admin",
      "owner",
      "manager",
      "cashier",
      "chef",
      "waiter",
      "inventory_staff",
    ),
    sortBy: Joi.string()
      .valid("createdAt", "name", "email")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

const assignRole = {
  body: Joi.object({
    employeeIds: Joi.array().items(objectId.required()).min(1).required(),
    roleId: objectId.required(),
  }),
};

module.exports = { create, update, idParam, list, listByRole, assignRole };
