const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const userRepository = require("../../auth/repositories/user.repository");
const roleRepository = require("../../role/repositories/role.repository");

const createStaff = async ({ payload, tenant, user, file }) => {
  const exists = await userRepository.findOne({
    restaurantId: tenant.restaurantId,
    email: payload.email,
  });
  if (exists)
    throw new AppError("Staff email already exists", httpStatus.CONFLICT);

  // Auto-assign default Staff role if no roleId explicitly provided
  let roleId = payload.roleId || null;
  let defaultPermissions = payload.permissions || [];
  if (!roleId) {
    const defaultRole = await roleRepository.findOne({
      restaurantId: tenant.restaurantId,
      roleName: "Staff",
      status: "active",
    });
    if (defaultRole) {
      roleId = defaultRole._id;
      // Inherit permissions from the Staff role when auto-assigning
      if (!payload.permissions || payload.permissions.length === 0) {
        defaultPermissions = defaultRole.permissions || [];
      }
    }
  }

  const plainPassword = payload.password || "RE123A1!"; //Math.random().toString(36).slice(-10) + "A1!";
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const staff = await userRepository.create({
    restaurantId: tenant.restaurantId,
    branchIds: payload.branchIds || [],
    defaultBranchId: payload.defaultBranchId || tenant.branchId,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: hashedPassword,
    role: payload.role,
    roleId,
    departmentId: payload.departmentId || null,
    shiftId: payload.shiftId || null,
    designationId: payload.designationId || null,
    permissions: defaultPermissions,
    employeeCode: payload.employeeCode || null,
    gender: payload.gender || null,
    dateOfBirth: payload.dateOfBirth || null,
    dateOfJoining: payload.dateOfJoining || null,
    address: payload.address || null,
    profileImage: file ? file.location : (payload.profileImage || null),
    emergencyContact: payload.emergencyContact || null,
    status: payload.status,
    createdBy: user.id,
  });

  // Return temporary password only when it was auto-generated
  if (!payload.password) {
    return { ...staff.toObject(), temporaryPassword: plainPassword };
  }
  return staff;
};

const updateStaff = async ({ id, payload, tenant, user, file }) => {
  const staff = await userRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!staff)
    throw new AppError("Staff member not found", httpStatus.NOT_FOUND);

  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 12);
  }
  if (file) payload.profileImage = file.location;

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

const STAFF_POPULATE = [
  { path: "departmentId", select: "departmentName" },
  { path: "designationId", select: "designationName" },
  { path: "shiftId", select: "shiftName startTime endTime" },
  { path: "roleId", select: "roleName" },
];

const STAFF_SELECT =
  "-password -refreshTokenHash -tokenVersion -passwordResetTokenHash -passwordResetExpiresAt";

const getStaff = async ({ id, tenant }) => {
  const staff = await userRepository.model
    .findOne({
      _id: id,
      restaurantId: tenant.restaurantId,
      branchIds: tenant.branchId,
      isDeleted: false,
    })
    .select(STAFF_SELECT)
    .populate(STAFF_POPULATE);
  if (!staff)
    throw new AppError("Staff member not found", httpStatus.NOT_FOUND);
  return staff;
};

const listStaff = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "name", "email"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchIds: tenant.branchId,
    isDeleted: false,
  };
  if (query.status) filter.status = query.status;
  if (query.role) filter.role = query.role;
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.designationId) filter.designationId = query.designationId;
  if (query.shiftId) filter.shiftId = query.shiftId;
  if (query.search)
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } },
    ];

  const [items, total] = await Promise.all([
    userRepository.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(STAFF_SELECT)
      .populate(STAFF_POPULATE),
    userRepository.model.countDocuments(filter),
  ]);
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
  const filter = {
    restaurantId: tenant.restaurantId,
    branchIds: tenant.branchId,
    isDeleted: false,
    roleId: role._id,
  };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    userRepository.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(STAFF_SELECT)
      .populate(STAFF_POPULATE),
    userRepository.model.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const assignRoleToStaff = async ({ userIds, roleId, tenant, user }) => {
  const role = await roleRepository.findOne({
    _id: roleId,
    restaurantId: tenant.restaurantId,
    status: "active",
  });
  if (!role) throw new AppError("Role not found", httpStatus.NOT_FOUND);

  const result = await userRepository.model.updateMany(
    {
      _id: { $in: userIds },
      restaurantId: tenant.restaurantId,
      isDeleted: false,
    },
    {
      $set: {
        roleId: role._id,
        permissions: role.permissions,
        updatedBy: user.id,
      },
    },
  );

  return {
    assigned: result.modifiedCount,
    roleId: role._id,
    roleName: role.roleName,
  };
};

module.exports = {
  createStaff,
  updateStaff,
  deleteStaff,
  getStaff,
  listStaff,
  listStaffByRole,
  assignRoleToStaff,
};
