const Joi = require("joi");

const dateRange = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
});

const dashboardRange = dateRange.keys({
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const objectId = Joi.string().hex().length(24);

const reportQuery = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    branchId: objectId,
    status: Joi.string().valid("pending", "held", "completed", "cancelled"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    export: Joi.string().valid("csv"),
  }),
};

const itemsQuery = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    branchId: objectId,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(20),
    export: Joi.string().valid("csv"),
  }),
};

const expensesQuery = {
  query: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    branchId: objectId,
    category: Joi.string().trim(),
    paymentMode: Joi.string().valid("cash", "card", "upi", "bank"),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
    export: Joi.string().valid("csv"),
  }),
};

module.exports = {
  range: { query: dateRange },
  dashboardRange: { query: dashboardRange },
  reportQuery,
  itemsQuery,
  expensesQuery,
};
