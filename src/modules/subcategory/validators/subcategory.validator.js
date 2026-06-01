const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const create = {
  body: Joi.object({
    categoryId: objectId.required(),
    subCategoryName: Joi.string().min(2).max(120).required(),
    status: Joi.string().valid("active", "inactive").default("active"),
    description: Joi.string().max(500).allow("", null),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    categoryId: objectId,
    subCategoryName: Joi.string().min(2).max(120),
    status: Joi.string().valid("active", "inactive"),
    description: Joi.string().max(500).allow("", null),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    categoryId: objectId,
    status: Joi.string().valid("active", "inactive"),
    sortBy: Joi.string()
      .valid("createdAt", "subCategoryName", "status")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, update, idParam, list };
