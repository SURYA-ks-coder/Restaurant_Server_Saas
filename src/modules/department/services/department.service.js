const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const departmentRepository = require("../repositories/department.repository");

const createDepartment = async ({ payload, tenant, user }) => {
  const exists = await departmentRepository.findOne({
    restaurantId: tenant.restaurantId,
    departmentName: payload.departmentName,
    isDeleted: false,
  });
  if (exists)
    throw new AppError("Department name already exists", httpStatus.CONFLICT);

  return departmentRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    createdBy: user.id,
  });
};

const updateDepartment = async ({ id, payload, tenant, user }) => {
  const department = await departmentRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!department)
    throw new AppError("Department not found", httpStatus.NOT_FOUND);

  if (
    payload.departmentName &&
    payload.departmentName !== department.departmentName
  ) {
    const exists = await departmentRepository.findOne({
      _id: { $ne: id },
      restaurantId: tenant.restaurantId,
      departmentName: payload.departmentName,
      isDeleted: false,
    });
    if (exists)
      throw new AppError("Department name already exists", httpStatus.CONFLICT);
  }

  return departmentRepository.updateById(id, {
    ...payload,
    updatedBy: user.id,
  });
};

const deleteDepartment = async ({ id, tenant, user }) => {
  const department = await departmentRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!department)
    throw new AppError("Department not found", httpStatus.NOT_FOUND);

  return departmentRepository.updateById(id, {
    isDeleted: true,
    status: "inactive",
    deletedAt: new Date(),
    deletedBy: user.id,
  });
};

const getDepartment = async ({ id, tenant }) => {
  const department = await departmentRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!department)
    throw new AppError("Department not found", httpStatus.NOT_FOUND);
  return department;
};

const listDepartments = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "name"]);
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.search)
    filter.departmentName = { $regex: query.search, $options: "i" };

  const [items, total] = await departmentRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
};
