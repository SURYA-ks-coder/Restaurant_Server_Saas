const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const create = {
  body: Joi.object({
    categoryName: Joi.string().min(2).max(120).required(),
    image: Joi.string().uri({ allowRelative: true }).optional(),
    displayOrder: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid("active", "inactive").default("active"),
    description: Joi.string().max(500).allow("", null)
  })
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    categoryName: Joi.string().min(2).max(120),
    image: Joi.string().uri({ allowRelative: true }),
    displayOrder: Joi.number().integer().min(0),
    status: Joi.string().valid("active", "inactive"),
    description: Joi.string().max(500).allow("", null)
  }).min(1)
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    status: Joi.string().valid("active", "inactive"),
    sortBy: Joi.string().valid("createdAt", "categoryName", "displayOrder", "status").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc")
  })
};

module.exports = { create, update, idParam, list };
