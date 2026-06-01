const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const expenseService = require("../services/expense.service");

const create = asyncHandler(async (req, res) => {
  const data = await expenseService.createExpense({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Expense created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await expenseService.updateExpense({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Expense updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense({ id: req.params.id, tenant: req.tenant });
  sendSuccess(res, { message: "Expense deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await expenseService.getExpense({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Expense fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await expenseService.listExpenses({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Expenses fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
