const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const money = Joi.number().min(0).precision(2);
const item = Joi.object({
  menuItemId: objectId.required(),
  itemName: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  price: money.required(),
  total: money.required(),
});

const create = {
  body: Joi.object({
    tableId: objectId.allow(null),
    customerName: Joi.string().max(120).allow("", null),
    items: Joi.array().items(item).min(1).required(),
    taxRate: Joi.number().min(0).max(100).default(0),
    discount: Joi.number().min(0).default(0),
  }),
};

const updateCart = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({ items: Joi.array().items(item).min(1).required() }),
};

const payment = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    method: Joi.string().valid("cash", "card", "upi", "bank").required(),
    amount: money.required(),
    transactionRef: Joi.string().max(255).allow("", null),
  }),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(
      "pending",
      "confirmed",
      "prepared",
      "completed",
      "cancelled",
    ),
    paymentStatus: Joi.string().valid("pending", "paid", "failed"),
    sortBy: Joi.string().valid("createdAt", "grandTotal").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, updateCart, payment, idParam, list };
