const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const roleRepository = require("../repositories/role.repository");
const userRepository = require("../../auth/repositories/user.repository");

const createRole = async ({ payload, tenant }) => {
  const exists = await roleRepository.findOne({
    restaurantId: tenant.restaurantId,
    roleName: payload.roleName,
  });
  if (exists)
    throw new AppError("Role name already exists", httpStatus.CONFLICT);

  try {
    return await roleRepository.create({
      ...payload,
      restaurantId: tenant.restaurantId,
    });
  } catch (error) {
    if (error.code === 11000)
      throw new AppError("Role name already exists", httpStatus.CONFLICT);
    throw error;
  }
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
  const sort = parseSort(query, ["createdAt", "roleName"]);
  const filter = { restaurantId: tenant.restaurantId };
  if (query.status) filter.status = query.status;
  if (query.search) filter.roleName = { $regex: query.search, $options: "i" };

  const [roles, total] = await roleRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });

  if (!roles.length)
    return { items: [], meta: paginationMeta({ total: 0, page, limit }) };

  const roleIds = roles.map((r) => r._id);

  // One aggregation: group users by roleId with designation lookup
  const userGroups = await userRepository.model.aggregate([
    {
      $match: {
        restaurantId: tenant.restaurantId,
        roleId: { $in: roleIds },
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "designations",
        localField: "designationId",
        foreignField: "_id",
        as: "_designation",
      },
    },
    {
      $group: {
        _id: "$roleId",
        users: {
          $push: {
            userId: "$_id",
            userName: "$name",
            profileImage: { $ifNull: ["$profileImage", null] },
            designation: { $arrayElemAt: ["$_designation.designationName", 0] },
            employeeCode: { $ifNull: ["$employeeCode", null] },
          },
        },
      },
    },
  ]);

  const userMap = Object.fromEntries(
    userGroups.map((g) => [String(g._id), g.users]),
  );

  const items = roles.map((role) => ({
    ...role.toObject(),
    users: userMap[String(role._id)] || [],
  }));

  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = { createRole, updateRole, deleteRole, getRole, listRoles };
