const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const designationRepository = require("../repositories/designation.repository");

const createDesignation = async ({ payload, tenant, user }) => {
  const exists = await designationRepository.findOne({
    restaurantId: tenant.restaurantId,
    designationName: payload.designationName,
    isDeleted: false,
  });
  if (exists) throw new AppError("Designation name already exists", httpStatus.CONFLICT);

  return designationRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    createdBy: user.id,
  });
};

const updateDesignation = async ({ id, payload, tenant, user }) => {
  const designation = await designationRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!designation) throw new AppError("Designation not found", httpStatus.NOT_FOUND);

  if (payload.designationName && payload.designationName !== designation.designationName) {
    const exists = await designationRepository.findOne({
      _id: { $ne: id },
      restaurantId: tenant.restaurantId,
      designationName: payload.designationName,
      isDeleted: false,
    });
    if (exists) throw new AppError("Designation name already exists", httpStatus.CONFLICT);
  }

  return designationRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteDesignation = async ({ id, tenant, user }) => {
  const designation = await designationRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!designation) throw new AppError("Designation not found", httpStatus.NOT_FOUND);

  return designationRepository.updateById(id, {
    isDeleted: true,
    status: "inactive",
    deletedAt: new Date(),
    deletedBy: user.id,
  });
};

const getDesignation = async ({ id, tenant }) => {
  const designation = await designationRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!designation) throw new AppError("Designation not found", httpStatus.NOT_FOUND);
  return designation;
};

const listDesignations = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "designationName"]);
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.search) filter.designationName = { $regex: query.search, $options: "i" };

  const [items, total] = await designationRepository.paginate({ filter, sort, skip, limit });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getDesignation,
  listDesignations,
};
