const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s]{7,20}$/);

const create = {
  body: Joi.object({
    branchName: Joi.string().min(2).max(120).required(),
    branchCode: Joi.string().alphanum().min(2).max(20).uppercase().required(),
    address: Joi.string().max(500).allow("", null),
    phone: phone.allow("", null),
    manager: objectId.allow(null),
    isDefault: Joi.boolean().default(false),
    status: Joi.string().valid("active", "inactive").default("active")
  })
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    branchName: Joi.string().min(2).max(120),
    branchCode: Joi.string().alphanum().min(2).max(20).uppercase(),
    address: Joi.string().max(500).allow("", null),
    phone: phone.allow("", null),
    manager: objectId.allow(null),
    isDefault: Joi.boolean(),
    status: Joi.string().valid("active", "inactive")
  }).min(1)
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    status: Joi.string().valid("active", "inactive"),
    sortBy: Joi.string().valid("createdAt", "branchName", "branchCode").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc")
  })
};

module.exports = { create, update, idParam, list };
