const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const statuses = ["available", "occupied", "reserved", "cleaning"];

const create = {
  body: Joi.object({
    tableName: Joi.string().min(1).max(120).required(),
    tableNumber: Joi.alternatives()
      .try(Joi.number().integer().min(1), Joi.string().trim().max(50))
      .required(),
    capacity: Joi.number().integer().min(1).default(2),
    floor: Joi.string().max(120).allow("", null),
    qrCode: Joi.string().max(255).allow("", null),
    status: Joi.string()
      .valid(...statuses)
      .default("available"),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    tableName: Joi.string().min(1).max(120),
    tableNumber: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string().trim().max(50),
    ),
    capacity: Joi.number().integer().min(1),
    floor: Joi.string().max(120).allow("", null),
    qrCode: Joi.string().max(255).allow("", null),
    status: Joi.string().valid(...statuses),
  }).min(1),
};

const status = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    status: Joi.string()
      .valid(...statuses)
      .required(),
  }),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    status: Joi.string().valid(...statuses),
    sortBy: Joi.string()
      .valid(
        "createdAt",
        "tableName",
        "tableNumber",
        "capacity",
        "floor",
        "status",
      )
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

const activeList = { query: list.query };

module.exports = { create, update, status, idParam, list, activeList };
