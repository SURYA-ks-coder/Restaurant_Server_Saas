const Joi = require("joi");

const objectId = Joi.string().hex().length(24);
const money = Joi.number().min(0).precision(2);

const create = {
  body: Joi.object({
    itemName: Joi.string().min(2).max(160).required(),
    itemCode: Joi.string().min(2).max(50).required(),
    barcode: Joi.string().max(80).allow("", null),
    categoryId: objectId.required(),
    subCategoryId: objectId.allow(null),
    description: Joi.string().max(1000).allow("", null),
    dineInPrice: money.required(),
    parcelPrice: money.required(),
    onlinePrice: money.required(),
    discountPrice: money.min(0).precision(2).default(0),
    taxPercentage: Joi.number().min(0).max(100).default(0),
    itemType: Joi.string()
      .valid("veg", "non_veg", "egg", "beverage")
      .required(),
    foodType: Joi.string()
      .valid("food", "drink", "dessert", "addon", "starter", "main")
      .default("food"),
    kitchenSection: Joi.string().max(80).allow("", null),
    preparationTime: Joi.number().integer().min(0).default(0),
    image: Joi.string().uri({ allowRelative: true }).optional(),
    stockEnabled: Joi.boolean().default(false),
    currentStock: Joi.number().min(0).default(0),
    minimumStock: Joi.number().min(0).default(0),
    unitType: Joi.string()
      .valid("plate", "bowl", "glass", "piece")
      .default("plate"),
    prepTime: Joi.number().integer().min(0).default(0),
    gstPercentage: Joi.number().min(0).max(100).default(0),
    availabilityStatus: Joi.string()
      .valid("available", "unavailable")
      .default("available"),
    status: Joi.string().valid("active", "inactive").default("active"),
  }),
};

const update = {
  params: Joi.object({ id: objectId.required() }),
  body: create.body
    .fork(
      [
        "itemName",
        "itemCode",
        "categoryId",
        "dineInPrice",
        "parcelPrice",
        "onlinePrice",
        "discountPrice",
        "itemType",
      ],
      (s) => s.optional(),
    )
    .min(1),
};

const idParam = { params: Joi.object({ id: objectId.required() }) };

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow("", null),
    categoryId: objectId,
    subCategoryId: objectId,
    itemType: Joi.string().valid("veg", "non_veg", "egg", "beverage"),
    foodType: Joi.string().valid(
      "food",
      "drink",
      "dessert",
      "addon",
      "starter",
      "main",
    ),
    kitchenSection: Joi.string().allow("", null),
    stockEnabled: Joi.boolean(),
    lowStock: Joi.boolean(),
    availabilityStatus: Joi.string().valid("available", "unavailable"),
    status: Joi.string().valid("active", "inactive"),
    sortBy: Joi.string()
      .valid("createdAt", "itemName", "itemCode", "currentStock", "status")
      .default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

const availability = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    availabilityStatus: Joi.string()
      .valid("available", "unavailable")
      .required(),
  }),
};

const prices = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    dineInPrice: money.required(),
    parcelPrice: money.required(),
    onlinePrice: money.required(),
    discountPrice: money.required(),
  }),
};

module.exports = { create, update, idParam, list, availability, prices };
