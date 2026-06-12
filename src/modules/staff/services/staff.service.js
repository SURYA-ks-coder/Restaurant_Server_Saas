const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const userRepository = require("../../auth/repositories/user.repository");
const roleRepository = require("../../role/repositories/role.repository");

const createStaff = async ({ payload, tenant, user }) => {
  const exists = await userRepository.findOne({
    restaurantId: tenant.restaurantId,
    email: payload.email,
  });
  if (exists) throw new AppError("Staff email already exists", httpStatus.CONFLICT);

  // Auto-assign default Staff role if no roleId explicitly provided
  let roleId = payload.roleId || null;
  if (!roleId) {
    const defaultRole = await roleRepository.findOne({
      restaurantId: tenant.restaurantId,
      roleName: "Staff",
      status: "active",
    });
    if (defaultRole) roleId = defaultRole._id;
  }

  return userRepository.create({
    restaurantId: tenant.restaurantId,
    branchIds: payload.branchIds || [],
    defaultBranchId: payload.defaultBranchId || tenant.branchId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: payload.role,
    roleId,
    permissions: payload.permissions || [],
    status: payload.status,
    createdBy: user.id,
  });
};

const updateStaff = async ({ id, payload, tenant, user }) => {
  const staff = await userRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!staff)
    throw new AppError("Staff member not found", httpStatus.NOT_FOUND);
  return userRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteStaff = async ({ id, tenant }) => {
  const staff = await userRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!staff)
    throw new AppError("Staff member not found", httpStatus.NOT_FOUND);
  return userRepository.updateById(id, { isDeleted: true, status: "inactive" });
};

const getStaff = async ({ id, tenant }) => {
  const staff = await userRepository
    .findOne({ _id: id, restaurantId: tenant.restaurantId, isDeleted: false })
    .select(
      "-password -refreshTokenHash -tokenVersion -passwordResetTokenHash -passwordResetExpiresAt",
    );
  if (!staff)
    throw new AppError("Staff member not found", httpStatus.NOT_FOUND);
  return staff;
};

const listStaff = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "name", "email"]);
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.role) filter.role = query.role;
  if (query.search)
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
    ];

  const items = await userRepository.model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(
      "-password -refreshTokenHash -tokenVersion -passwordResetTokenHash -passwordResetExpiresAt",
    );
  const total = await userRepository.model.countDocuments(filter);
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const listStaffByRole = async ({ roleId, query, tenant }) => {
  const role = await roleRepository.findOne({
    _id: roleId,
    restaurantId: tenant.restaurantId,
  });
  if (!role) throw new AppError("Role not found", httpStatus.NOT_FOUND);

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "name", "email"]);
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false, roleId: role._id };
  if (query.status) filter.status = query.status;

  const items = await userRepository.model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select(
      "-password -refreshTokenHash -tokenVersion -passwordResetTokenHash -passwordResetExpiresAt",
    );
  const total = await userRepository.model.countDocuments(filter);
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = { createStaff, updateStaff, deleteStaff, getStaff, listStaff, listStaffByRole };
