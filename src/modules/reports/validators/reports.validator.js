const Joi = require("joi");

const dateRange = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
});

const dashboardRange = dateRange.keys({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = {
  range: { query: dateRange },
  dashboardRange: { query: dashboardRange },
};
