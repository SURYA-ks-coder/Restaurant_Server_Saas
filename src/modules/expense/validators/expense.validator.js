const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const money = Joi.number().min(0).precision(2);

const create = {
  body: Joi.object({
    expenseName: Joi.string().min(2).max(120).required(),
    category: Joi.string().min(2).max(120).required(),
    amount: money.required(),
    paymentMode: Joi.string()
      .valid("cash", "card", "upi", "bank")
      .default("cash"),
    expenseDate: Joi.date().required(),
    notes: Joi.string().max(500).allow("", null),
    attachment: Joi.string().uri({ allowRelative: true }).allow("", null),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    expenseName: Joi.string().min(2).max(120),
    category: Joi.string().min(2).max(120),
    amount: money,
    paymentMode: Joi.string().valid("cash", "card", "upi", "bank"),
    expenseDate: Joi.date(),
    notes: Joi.string().max(500).allow("", null),
    attachment: Joi.string().uri({ allowRelative: true }).allow("", null),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    startDate: Joi.date().allow("", null),
    endDate: Joi.date().allow("", null),
    category: Joi.string().max(120).allow("", null),
    sortBy: Joi.string()
      .valid("createdAt", "expenseDate", "amount")
      .default("expenseDate"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, update, idParam, list };
