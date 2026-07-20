const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const customerService = require("../services/customer.service");

const create = asyncHandler(async (req, res) => {
  const data = await customerService.createCustomer({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Customer created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await customerService.updateCustomer({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Customer updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Customer deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomer({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Customer fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await customerService.listCustomers({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Customers fetched", data: items, meta });
});

const history = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerHistory({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Customer history fetched", data });
});

const qrProfile = asyncHandler(async (req, res) => {
  const { restaurantId, branchId, mobileNumber } = req.body;
  const data = await customerService.getQrCustomerProfile({
    restaurantId,
    branchId,
    mobileNumber,
  });
  sendSuccess(res, { message: "Customer profile fetched", data });
});

module.exports = { create, update, remove, get, list, history, qrProfile };
