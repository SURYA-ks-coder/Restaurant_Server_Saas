const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const updateSettings = {
  body: Joi.object({
    receipt: Joi.object({
      showLogo: Joi.boolean(),
      logoUrl: Joi.string().uri().allow("", null),
      headerText: Joi.string().max(255).allow("", null),
      footerText: Joi.string().max(255).allow("", null),
      showGSTNumber: Joi.boolean(),
      gstNumber: Joi.string().max(30).allow("", null),
      currencySymbol: Joi.string().max(5).allow("", null),
    }),
    kot: Joi.object({
      headerText: Joi.string().max(255).allow("", null),
      footerText: Joi.string().max(255).allow("", null),
      showTableName: Joi.boolean(),
    }),
    qrOrderSlip: Joi.object({
      headerText: Joi.string().max(255).allow("", null),
      footerText: Joi.string().max(255).allow("", null),
    }),
  }),
};

const printer = Joi.object({
  name: Joi.string().max(120).required(),
  purpose: Joi.string().valid("kot", "bill", "qr_order").required(),
  kitchenSections: Joi.array().items(Joi.string().max(120)).default([]),
  connectionType: Joi.string().valid("lan", "browser").default("browser"),
  ip: Joi.string()
    .ip({ version: ["ipv4"] })
    .when("connectionType", { is: "lan", then: Joi.required() }),
  port: Joi.number().integer().min(1).max(65535).default(9100),
  paperWidth: Joi.string().valid("58mm", "80mm").default("80mm"),
  isActive: Joi.boolean().default(true),
});

const addPrinter = { body: printer };

const updatePrinter = {
  params: Joi.object({ printerId: objectId.required() }),
  body: printer.fork(["name", "purpose"], (schema) => schema.optional()),
};

const printerIdParam = {
  params: Joi.object({ printerId: objectId.required() }),
};

module.exports = { updateSettings, addPrinter, updatePrinter, printerIdParam };
