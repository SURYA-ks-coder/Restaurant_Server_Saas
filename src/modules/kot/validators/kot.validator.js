const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const kotItem = Joi.object({
  menuItemId: objectId.required(),
  itemName: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  note: Joi.string().max(255).allow("", null),
});

const create = {
  body: Joi.object({
    billId: objectId.required(),
    kitchenSection: Joi.string().max(120).required(),
    items: Joi.array().items(kotItem).min(1).required(),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
    chefId: objectId.allow(null),
    chefName: Joi.string().max(120).allow("", null),
    notes: Joi.string().max(500).allow("", null),
  }),
};

const status = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    status: Joi.string()
      .valid("pending", "preparing", "ready", "served", "cancelled")
      .required(),
  }),
};

const itemStatus = {
  // params: Joi.object({ }),
  body: Joi.object({
    id: objectId.required(),
    itemId: objectId.required(),
    status: Joi.string()
      .valid("pending", "preparing", "ready", "served")
      .required(),
  }),
};

const priority = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    priority: Joi.string().valid("low", "medium", "high").required(),
  }),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(
      "pending",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ),
    kitchenSection: Joi.string().max(120).allow("", null),
    billId: objectId.allow(null),
    sortBy: Joi.string()
      .valid("createdAt", "priority", "status")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, status, itemStatus, priority, idParam, list };
