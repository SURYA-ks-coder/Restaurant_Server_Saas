const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const money = Joi.number().min(0).precision(2);
const quantity = Joi.number().integer().min(1);
const paymentMethod = Joi.string().valid(
  "cash",
  "card",
  "upi",
  "bank",
  "split",
);

const paymentEntry = Joi.object({
  method: paymentMethod.required(),
  amount: money.required(),
  transactionRef: Joi.string().max(255).allow("", null),
  paidAt: Joi.date(),
});

const billItem = Joi.object({
  menuItemId: objectId.required(),
  itemName: Joi.string().required(),
  quantity: quantity.required(),
  price: money.required(),
  taxAmount: money.default(0),
  total: money.required(),
});

const create = {
  body: Joi.object({
    orderType: Joi.string()
      .valid("dine_in", "parcel", "online", "qr")
      .required(),
    tableId: objectId.allow(null),
    customerId: objectId.allow(null),
    billNo: Joi.string().trim().max(100),
    items: Joi.array().items(billItem).min(1).required(),
    taxRate: Joi.number().min(0).max(100).default(0),
    discount: Joi.number().min(0).default(0),
    payments: Joi.array().items(paymentEntry).default([]),
    paymentStatus: Joi.string().valid("pending", "paid", "refunded"),
    status: Joi.string().valid("open", "held", "completed", "cancelled"),
    note: Joi.string().max(500).allow("", null),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    tableId: objectId,
    customerId: objectId,
    orderType: Joi.string().valid("dine_in", "parcel", "online", "qr"),
    taxRate: Joi.number().min(0).max(100),
    discount: Joi.number().min(0),
    note: Joi.string().max(500),
  }).min(1),
};

const addItem = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({ item: billItem.required() }),
};

const updateItem = {
  params: Joi.object({ id: objectId.required(), itemId: objectId.required() }),
  body: Joi.object({ quantity: quantity.required() }),
};

const discount = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({ discount: Joi.number().min(0).required() }),
};

const payment = {
  params: Joi.object({ id: objectId.required() }),
  body: paymentEntry,
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("open", "held", "completed", "cancelled"),
    paymentStatus: Joi.string().valid("pending", "paid", "refunded"),
    orderType: Joi.string().valid("dine_in", "parcel", "online", "qr"),
    customerId: objectId.allow(null),
    sortBy: Joi.string()
      .valid("createdAt", "grandTotal", "subTotal", "status")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = {
  create,
  update,
  addItem,
  updateItem,
  discount,
  payment,
  idParam,
  list,
};
