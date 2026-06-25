const Joi = require("joi");

const topSelling = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(10),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

const recentActivities = {
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

const hourlyRevenue = {
  query: Joi.object({
    date: Joi.date().iso().default(() => new Date()),
  }),
};

module.exports = { topSelling, recentActivities, hourlyRevenue };
