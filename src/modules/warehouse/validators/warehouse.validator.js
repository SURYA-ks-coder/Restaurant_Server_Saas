const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const create = {
  body: Joi.object({
    name: Joi.string().trim().required(),
    description: Joi.string().trim().allow("", null),
    type: Joi.string()
      .valid("main", "cold-storage", "dry-storage", "beverage", "other")
      .default("main"),
    isActive: Joi.boolean().default(true),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    name: Joi.string().trim(),
    description: Joi.string().trim().allow("", null),
    type: Joi.string().valid("main", "cold-storage", "dry-storage", "beverage", "other"),
    isActive: Joi.boolean(),
  }).min(1),
};

const idParam = {
  params: Joi.object({ id: objectId.required() }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sort: Joi.string(),
    order: Joi.string().valid("asc", "desc"),
    search: Joi.string().trim(),
    type: Joi.string().valid("main", "cold-storage", "dry-storage", "beverage", "other"),
    isActive: Joi.string().valid("true", "false"),
  }),
};

module.exports = { create, update, idParam, list };
