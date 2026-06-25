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

// ── POST body validators ──────────────────────────────────────────────────────

const _baseBody = {
  branchId: objectId,
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  export: Joi.string().valid("csv"),
};

const reportBody = {
  body: Joi.object({
    ..._baseBody,
    groupBy: Joi.string().valid("day", "week", "month").default("day"),
    orderType: Joi.string().valid("dine_in", "parcel", "online", "qr"),
  }),
};

const hourlyBody = {
  body: Joi.object({
    branchId: objectId,
    date: Joi.date().iso(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

const branchOnlyBody = {
  body: Joi.object({
    branchId: objectId,
  }),
};

const orderBody = {
  body: Joi.object({
    ..._baseBody,
    orderStatus: Joi.string().valid("pending", "held", "completed", "cancelled"),
    orderType: Joi.string().valid("dine_in", "parcel", "online", "qr"),
  }),
};

const staffBody = {
  body: Joi.object({
    ..._baseBody,
    department: objectId,
    staffStatus: Joi.string().valid("active", "inactive", "blocked"),
    role: Joi.string().valid(
      "super_admin",
      "owner",
      "manager",
      "cashier",
      "chef",
      "waiter",
      "inventory_staff",
    ),
  }),
};

const expensesBody = {
  body: Joi.object({
    ..._baseBody,
    category: Joi.string().trim(),
    paymentMode: Joi.string().valid("cash", "card", "upi", "bank"),
  }),
};

module.exports = {
  range: { query: dateRange },
  dashboardRange: { query: dashboardRange },
  reportQuery,
  itemsQuery,
  expensesQuery,
  // POST body validators
  reportBody,
  hourlyBody,
  branchOnlyBody,
  orderBody,
  staffBody,
  expensesBody,
};
