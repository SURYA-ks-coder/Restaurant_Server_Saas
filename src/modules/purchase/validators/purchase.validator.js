const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const money = Joi.number().min(0).precision(2);

const create = {
  body: Joi.object({
    supplierId: objectId.allow("", null),
    invoiceNumber: Joi.string().max(60).allow("", null),
    purchaseDate: Joi.date(),
    notes: Joi.string().max(500).allow("", null),
    items: Joi.array()
      .items(
        Joi.object({
          inventoryItemId: objectId.required(),
          quantity: Joi.number().greater(0).required(),
          unitCost: money.required(),
        }),
      )
      .min(1)
      .required(),
  }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("received", "cancelled"),
    supplierId: objectId,
    search: Joi.string().allow("", null),
    startDate: Joi.date(),
    endDate: Joi.date(),
    sortBy: Joi.string()
      .valid("createdAt", "purchaseDate", "totalAmount")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const cancel = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    reason: Joi.string().max(255).allow("", null),
  }),
};

module.exports = { create, list, idParam, cancel };
