const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const ingredient = Joi.object({
  inventoryItemId: objectId.required(),
  quantity: Joi.number().min(0).required(),
});

const create = {
  body: Joi.object({
    menuItemId: objectId.required(),
    ingredients: Joi.array().items(ingredient).min(1).required(),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    menuItemId: objectId,
    ingredients: Joi.array().items(ingredient).min(1),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    menuItemId: objectId,
    sortBy: Joi.string().valid("createdAt").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, update, idParam, list };
