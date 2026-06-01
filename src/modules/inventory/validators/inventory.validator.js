const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const money = Joi.number().min(0).precision(2);
const quantity = Joi.number().min(0);

const create = {
  body: Joi.object({
    materialName: Joi.string().min(1).max(120).required(),
    category: Joi.string().max(120).allow("", null),
    supplier: Joi.string().max(120).allow("", null),
    unit: Joi.string().min(1).max(50).required(),
    stockQuantity: Joi.number().min(0).default(0),
    minimumStock: Joi.number().min(0).default(0),
    purchasePrice: money.default(0),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    materialName: Joi.string().min(1).max(120),
    category: Joi.string().max(120).allow("", null),
    supplier: Joi.string().max(120).allow("", null),
    unit: Joi.string().min(1).max(50),
    stockQuantity: Joi.number().min(0),
    minimumStock: Joi.number().min(0),
    purchasePrice: money,
    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

const adjustStock = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    quantity: Joi.number().required(),
    notes: Joi.string().max(255).allow("", null),
  }),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("active", "inactive"),
    search: Joi.string().allow("", null),
    sortBy: Joi.string()
      .valid("createdAt", "materialName", "stockQuantity", "minimumStock")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, update, adjustStock, idParam, list };
