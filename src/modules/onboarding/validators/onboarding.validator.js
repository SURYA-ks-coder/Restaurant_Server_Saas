const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^[0-9+\-\s]{7,20}$/);
const slug = Joi.string().lowercase().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(80);
const gst = Joi.string().uppercase().trim().pattern(/^[0-9A-Z]{15}$/);

const branch = Joi.object({
  branchName: Joi.string().min(2).max(120).required(),
  branchCode: Joi.string().alphanum().min(2).max(20).uppercase().default("MAIN"),
  address: Joi.string().max(500).allow("", null),
  phone: phone.allow("", null),
  manager: objectId.allow(null)
});

const register = {
  body: Joi.object({
    restaurantName: Joi.string().min(2).max(160).required(),
    ownerName: Joi.string().min(2).max(120).required(),
    mobileNumber: phone.required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required(),
    GSTNumber: gst.allow("", null),
    address: Joi.string().max(500).allow("", null),
    city: Joi.string().max(80).allow("", null),
    state: Joi.string().max(80).allow("", null),
    country: Joi.string().max(80).default("India"),
    pincode: Joi.string().max(20).allow("", null),
    currency: Joi.string().length(3).uppercase().default("INR"),
    timezone: Joi.string().max(80).default("Asia/Kolkata"),
    subscriptionPlan: Joi.alternatives().try(objectId, Joi.string().max(80)).default("Free Trial"),
    slug,
    subdomain: slug,
    customDomain: Joi.string().domain().lowercase().allow("", null),
    branch: branch.default({ branchName: "Main Branch", branchCode: "MAIN" }),
    branchName: Joi.string().min(2).max(120),
    branchCode: Joi.string().alphanum().min(2).max(20).uppercase(),
    branchAddress: Joi.string().max(500).allow("", null),
    branchPhone: phone.allow("", null)
  })
};

const setupWizard = {
  body: Joi.object({
    restaurantName: Joi.string().min(2).max(160),
    GSTNumber: gst.allow("", null),
    address: Joi.string().max(500).allow("", null),
    city: Joi.string().max(80).allow("", null),
    state: Joi.string().max(80).allow("", null),
    country: Joi.string().max(80),
    pincode: Joi.string().max(20).allow("", null),
    currency: Joi.string().length(3).uppercase(),
    timezone: Joi.string().max(80),
    subscriptionPlan: Joi.alternatives().try(objectId, Joi.string().max(80)),
    customDomain: Joi.string().domain().lowercase().allow("", null),
    subdomain: slug,
    branch
  }).min(1)
};

const domainCheck = {
  body: Joi.object({
    slug,
    subdomain: slug,
    customDomain: Joi.string().domain().lowercase()
  }).or("slug", "subdomain", "customDomain")
};

module.exports = { register, setupWizard, domainCheck };
