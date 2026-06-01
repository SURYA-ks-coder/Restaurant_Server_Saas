const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const customerRepository = require("../repositories/customer.repository");
const billRepository = require("../../pos/repositories/pos.repository");

const createCustomer = async ({ payload, tenant, user }) => {
  const exists = await customerRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    mobileNumber: payload.mobileNumber,
  });
  if (exists)
    throw new AppError("Customer already exists", httpStatus.CONFLICT);

  return customerRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateCustomer = async ({ id, payload, tenant, user }) => {
  const customer = await customerRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!customer) throw new AppError("Customer not found", httpStatus.NOT_FOUND);
  return customerRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteCustomer = async ({ id, tenant }) => {
  const customer = await customerRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!customer) throw new AppError("Customer not found", httpStatus.NOT_FOUND);
  return customerRepository.updateById(id, { status: "inactive" });
};

const getCustomer = async ({ id, tenant }) => {
  const customer = await customerRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!customer) throw new AppError("Customer not found", httpStatus.NOT_FOUND);
  return customer;
};

const listCustomers = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "customerName",
    "totalOrders",
    "loyaltyPoints",
  ]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  };
  if (query.status) filter.status = query.status;
  if (query.search)
    filter.$or = [
      { customerName: { $regex: query.search, $options: "i" } },
      { mobileNumber: { $regex: query.search, $options: "i" } },
    ];

  const [items, total] = await customerRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const getCustomerHistory = async ({ id, tenant }) => {
  const customer = await customerRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!customer) throw new AppError("Customer not found", httpStatus.NOT_FOUND);
  return billRepository.model
    .find({
      customerId: id,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    })
    .sort({ createdAt: -1 });
};

module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  getCustomerHistory,
};
