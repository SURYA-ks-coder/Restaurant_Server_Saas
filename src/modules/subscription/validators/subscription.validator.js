const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const planBody = {
  planName: Joi.string().min(2).max(80).required(),
  price: Joi.number().min(0).required(),
  billingCycle: Joi.string().valid("trial", "monthly", "yearly", "custom").required(),
  trialDays: Joi.number().integer().min(0).default(0),
  maxBranches: Joi.number().integer().min(0).default(1),
  maxUsers: Joi.number().integer().min(0).default(3),
  maxOrders: Joi.number().integer().min(0).default(100),
  features: Joi.array().items(Joi.string().trim()).default([]),
  status: Joi.string().valid("active", "inactive", "archived").default("active")
};

const createPlan = { body: Joi.object(planBody) };

const updatePlan = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    planName: Joi.string().min(2).max(80),
    price: Joi.number().min(0),
    billingCycle: Joi.string().valid("trial", "monthly", "yearly", "custom"),
    trialDays: Joi.number().integer().min(0),
    maxBranches: Joi.number().integer().min(0),
    maxUsers: Joi.number().integer().min(0),
    maxOrders: Joi.number().integer().min(0),
    features: Joi.array().items(Joi.string().trim()),
    status: Joi.string().valid("active", "inactive", "archived")
  }).min(1)
};

const listPlans = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid("active", "inactive", "archived"),
    billingCycle: Joi.string().valid("trial", "monthly", "yearly", "custom"),
    sortBy: Joi.string().valid("createdAt", "planName", "price").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc")
  })
};

const selectPlan = {
  body: Joi.object({
    planId: Joi.alternatives().try(objectId, Joi.string().max(80)).required()
  })
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

module.exports = { createPlan, updatePlan, listPlans, selectPlan, idParam };
