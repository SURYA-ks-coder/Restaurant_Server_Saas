const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s]{7,20}$/);
const statuses = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"];
const sources = ["walk_in", "phone", "online", "staff"];

const dateRange = (schema) =>
  schema.custom((value, helpers) => {
    if (value.startAt && value.endAt && value.endAt <= value.startAt) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "valid reservation date range");

const create = {
  body: dateRange(
    Joi.object({
      tableId: objectId.required(),
      customerId: objectId,
      customerName: Joi.string().min(2).max(120).required(),
      mobileNumber: phone.required(),
      guestCount: Joi.number().integer().min(1).required(),
      startAt: Joi.date().required(),
      endAt: Joi.date().required(),
      status: Joi.string()
        .valid(...statuses)
        .default("pending"),
      source: Joi.string()
        .valid(...sources)
        .default("staff"),
      specialRequest: Joi.string().max(1000).allow("", null),
    }),
  ).messages({ "any.invalid": "endAt must be after startAt" }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: dateRange(
    Joi.object({
      tableId: objectId,
      customerId: objectId.allow(null),
      customerName: Joi.string().min(2).max(120),
      mobileNumber: phone,
      guestCount: Joi.number().integer().min(1),
      startAt: Joi.date(),
      endAt: Joi.date(),
      status: Joi.string().valid(...statuses),
      source: Joi.string().valid(...sources),
      specialRequest: Joi.string().max(1000).allow("", null),
      cancellationReason: Joi.string().max(500).allow("", null),
    }).min(1),
  ).messages({ "any.invalid": "endAt must be after startAt" }),
};

const status = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    status: Joi.string()
      .valid(...statuses)
      .required(),
    cancellationReason: Joi.string().max(500).allow("", null),
  }),
};

const cancel = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    cancellationReason: Joi.string().max(500).allow("", null),
  }),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    tableId: objectId,
    customerId: objectId,
    status: Joi.string().valid(...statuses),
    from: Joi.date(),
    to: Joi.date(),
    sortBy: Joi.string()
      .valid("createdAt", "startAt", "endAt", "guestCount", "status")
      .default("startAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("asc"),
  }),
};

module.exports = { create, update, status, cancel, idParam, list };
