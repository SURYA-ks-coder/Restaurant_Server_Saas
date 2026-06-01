const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const create = {
  body: Joi.object({
    supplierName: Joi.string().trim().min(2).max(120).required(),

    image: Joi.string().uri({ allowRelative: true }).allow("", null),

    contactPerson: Joi.string().trim().max(100).allow("", null),

    phone: Joi.string().trim().max(20).allow("", null),

    email: Joi.string().email().allow("", null),

    gstNumber: Joi.string().trim().max(50).allow("", null),

    address: Joi.string().trim().max(500).allow("", null),

    notes: Joi.string().trim().max(1000).allow("", null),

    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

const update = {
  params: Joi.object({
    id: objectId.required(),
  }),

  body: Joi.object({
    supplierName: Joi.string().trim().min(2).max(120),

    image: Joi.string().uri({ allowRelative: true }).allow("", null),

    contactPerson: Joi.string().trim().max(100).allow("", null),

    phone: Joi.string().trim().max(20).allow("", null),

    email: Joi.string().email().allow("", null),

    gstNumber: Joi.string().trim().max(50).allow("", null),

    address: Joi.string().trim().max(500).allow("", null),

    notes: Joi.string().trim().max(1000).allow("", null),

    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

const idParam = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(100).default(10),

    search: Joi.string().allow("", null),

    status: Joi.string().valid("active", "inactive"),

    sortBy: Joi.string()
      .valid("createdAt", "supplierName", "contactPerson", "status")
      .default("createdAt"),

    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = {
  create,
  update,
  idParam,
  list,
};
