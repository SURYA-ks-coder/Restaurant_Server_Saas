const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const customerRepository = require("../repositories/customer.repository");
const billRepository = require("../../pos/repositories/pos.repository");
const Restaurant = require("../../restaurant/models/Restaurant.model");
const branchRepository = require("../../branch/repositories/branch.repository");
const Counter = require("../Counter.model");

const lettersOnly = (value) => String(value || "").replace(/[^a-zA-Z]/g, "");

const buildGuestNamePrefix = async ({ restaurantId, branchId }) => {
  const [restaurant, branch] = await Promise.all([
    Restaurant.findById(restaurantId).select("name restaurantName"),
    branchRepository.findById(branchId, "branchName code branchCode"),
  ]);

  const restCode =
    lettersOnly(restaurant?.name || restaurant?.restaurantName)
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, "X") || "GST";
  const branchCode =
    lettersOnly(branch?.code || branch?.branchCode || branch?.branchName)
      .slice(0, 2)
      .toUpperCase()
      .padEnd(2, "X") || "XX";

  return `${restCode}${branchCode}`;
};

const nextGuestSequence = async ({ restaurantId, branchId }) => {
  const key = `guestCustomer:${restaurantId}:${branchId}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return counter.seq;
};

/**
 * Finds the customer for a phone number within a restaurant/branch, or
 * creates one. A phone number is only ever attached to one Customer record
 * per branch (enforced by Customer's unique index) — every order placed
 * from that phone reuses the same customer instead of creating a new one.
 */
const resolveOrderCustomer = async ({
  restaurantId,
  branchId,
  mobileNumber,
  customerName,
}) => {
  const phone = String(mobileNumber || "").trim();
  if (!phone) {
    throw new AppError(
      "Customer phone number is required",
      httpStatus.BAD_REQUEST,
    );
  }

  const existing = await customerRepository.findOne({
    restaurantId,
    branchId,
    mobileNumber: phone,
  });
  if (existing) return existing;

  let nameToUse = String(customerName || "").trim();
  if (!nameToUse) {
    const prefix = await buildGuestNamePrefix({ restaurantId, branchId });
    const seq = await nextGuestSequence({ restaurantId, branchId });
    nameToUse = `${prefix}${seq}`;
  }

  try {
    return await customerRepository.create({
      restaurantId,
      branchId,
      customerName: nameToUse,
      mobileNumber: phone,
      status: "active",
    });
  } catch (error) {
    // Unique (restaurantId, branchId, mobileNumber) index race: another
    // request created this same phone number first — reuse it.
    if (error?.code === 11000) {
      const winner = await customerRepository.findOne({
        restaurantId,
        branchId,
        mobileNumber: phone,
      });
      if (winner) return winner;
    }
    throw error;
  }
};

/**
 * Public QR-menu lookup: a customer's profile + recent order history by
 * phone number, scoped to a single restaurant/branch. Used by the
 * unauthenticated customer-facing menu app, so an unknown phone number
 * simply returns no customer/orders rather than a 404.
 */
const getQrCustomerProfile = async ({
  restaurantId,
  branchId,
  mobileNumber,
}) => {
  const phone = String(mobileNumber || "").trim();
  if (!restaurantId || !branchId || !phone) {
    throw new AppError(
      "restaurantId, branchId and mobileNumber are required",
      httpStatus.BAD_REQUEST,
    );
  }

  const customer = await customerRepository.findOne({
    restaurantId,
    branchId,
    mobileNumber: phone,
  });

  if (!customer) return { customer: null, orders: [] };

  const orders = await billRepository.model
    .find({ restaurantId, branchId, customerId: customer._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .select(
      "billNo orderType items subTotal taxTotal grandTotal taxRate note status paymentStatus createdAt",
    );

  return { customer, orders };
};

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
  resolveOrderCustomer,
  getQrCustomerProfile,
};
