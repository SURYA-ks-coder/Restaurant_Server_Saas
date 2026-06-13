const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const timePattern = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/);

const create = {
  body: Joi.object({
    shiftName: Joi.string().min(2).max(120).required(),
    startTime: timePattern.required().messages({
      "string.pattern.base": "startTime must be in HH:MM format (24-hour)",
    }),
    endTime: timePattern.required().messages({
      "string.pattern.base": "endTime must be in HH:MM format (24-hour)",
    }),
    description: Joi.string().max(500).allow("", null),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    shiftName: Joi.string().min(2).max(120),
    startTime: timePattern.messages({
      "string.pattern.base": "startTime must be in HH:MM format (24-hour)",
    }),
    endTime: timePattern.messages({
      "string.pattern.base": "endTime must be in HH:MM format (24-hour)",
    }),
    description: Joi.string().max(500).allow("", null),
    status: Joi.string().valid("active", "inactive"),
  }).min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    status: Joi.string().valid("active", "inactive"),
    sortBy: Joi.string().valid("createdAt", "shiftName").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = { create, update, idParam, list };
