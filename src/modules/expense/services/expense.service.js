const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const expenseRepository = require("../repositories/expense.repository");

const createExpense = async ({ payload, tenant, user }) => {
  return expenseRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateExpense = async ({ id, payload, tenant, user }) => {
  const expense = await expenseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!expense) throw new AppError("Expense not found", httpStatus.NOT_FOUND);
  return expenseRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteExpense = async ({ id, tenant }) => {
  const expense = await expenseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!expense) throw new AppError("Expense not found", httpStatus.NOT_FOUND);
  return expenseRepository.updateById(id, { isDeleted: true, deletedAt: new Date() });
};

const getExpense = async ({ id, tenant }) => {
  const expense = await expenseRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!expense) throw new AppError("Expense not found", httpStatus.NOT_FOUND);
  return expense;
};

const listExpenses = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "expenseDate", "amount"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.startDate || query.endDate) {
    filter.expenseDate = {};
    if (query.startDate) filter.expenseDate.$gte = new Date(query.startDate);
    if (query.endDate) filter.expenseDate.$lte = new Date(query.endDate);
  }
  if (query.category) filter.category = query.category;

  const [items, total] = await expenseRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  listExpenses,
};
