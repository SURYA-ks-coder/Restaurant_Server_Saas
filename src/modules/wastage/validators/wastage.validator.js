const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const record = {
  body: Joi.object({
    inventoryItemId: objectId.required(),
    quantity: Joi.number().positive().required(),
    reason: Joi.string()
      .valid("expired", "spoiled", "damaged", "overcooked", "spilled", "other")
      .required(),
    notes: Joi.string().trim().allow("", null),
  }),
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
    reason: Joi.string().valid("expired", "spoiled", "damaged", "overcooked", "spilled", "other"),
    inventoryItemId: objectId,
    from: Joi.date().iso(),
    to: Joi.date().iso(),
  }),
};

const report = {
  query: Joi.object({
    from: Joi.date().iso(),
    to: Joi.date().iso(),
  }),
};

module.exports = { record, idParam, list, report };
