const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const roleRepository = require("../repositories/role.repository");

const createRole = async ({ payload, tenant, user }) => {
  const exists = await roleRepository.findOne({
    restaurantId: tenant.restaurantId,
    name: payload.name,
  });
  if (exists)
    throw new AppError("Role name already exists", httpStatus.CONFLICT);
  return roleRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    createdBy: user.id,
  });
};

const updateRole = async ({ id, payload, tenant, user }) => {
  const role = await roleRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
  });
  if (!role) throw new AppError("Role not found", httpStatus.NOT_FOUND);
  return roleRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteRole = async ({ id, tenant }) => {
  const role = await roleRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
  });
  if (!role) throw new AppError("Role not found", httpStatus.NOT_FOUND);
  return roleRepository.updateById(id, { status: "inactive" });
};

const getRole = async ({ id, tenant }) => {
  const role = await roleRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
  });
  if (!role) throw new AppError("Role not found", httpStatus.NOT_FOUND);
  return role;
};

const listRoles = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "name"]);
  const filter = { restaurantId: tenant.restaurantId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.name = { $regex: query.search, $options: "i" };
  const [items, total] = await roleRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = { createRole, updateRole, deleteRole, getRole, listRoles };
