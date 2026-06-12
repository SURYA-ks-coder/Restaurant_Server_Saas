const Joi = require("joi");
const { menuList } = require("../../../utils/menuList");

const objectId = Joi.string().hex().length(24);
const validMenuValues = menuList.map((m) => m.id);

const create = {
  body: Joi.object({
    roleName: Joi.string().min(2).max(120).required(),
    // permissions: Joi.array().items(Joi.string().trim()).default([]),
    menus: Joi.array()
      .items(Joi.number().valid(...validMenuValues))
      .default([]),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    roleName: Joi.string().min(2).max(120),
    permissions: Joi.array().items(Joi.string().trim()),
    menus: Joi.array().items(Joi.number().valid(...validMenuValues)),
    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("active", "inactive"),
    search: Joi.string().allow("", null),
    sortBy: Joi.string().valid("createdAt", "roleName").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, update, idParam, list };
