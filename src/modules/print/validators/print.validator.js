const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const idParam = { params: Joi.object({ id: objectId.required() }) };

module.exports = { idParam };
