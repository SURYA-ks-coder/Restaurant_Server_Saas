const Joi = require("joi");

const objectId = Joi.string().hex().length(24);

const transferItem = Joi.object({
  inventoryItemId: objectId.required(),
  quantity: Joi.number().positive().required(),
});

const create = {
  body: Joi.object({
    fromBranchId: objectId.required(),
    toBranchId: objectId.required(),
    fromWarehouseId: objectId.allow(null, ""),
    toWarehouseId: objectId.allow(null, ""),
    items: Joi.array().items(transferItem).min(1).required(),
    notes: Joi.string().trim().allow("", null),
  }),
};

const reject = {
  params: Joi.object({ id: objectId.required() }),
  body: Joi.object({
    reason: Joi.string().trim().required(),
  }),
};

const idParam = {
  params: Joi.object({ id: objectId.required() }),
};

const list = {
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    sort: Joi.string(),
    order: Joi.string().valid("asc", "desc"),
    status: Joi.string().valid("pending", "approved", "completed", "rejected"),
    fromBranchId: objectId,
    toBranchId: objectId,
  }),
};

module.exports = { create, reject, idParam, list };
