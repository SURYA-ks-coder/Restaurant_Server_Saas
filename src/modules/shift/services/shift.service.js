const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const shiftRepository = require("../repositories/shift.repository");

const createShift = async ({ payload, tenant, user }) => {
  const exists = await shiftRepository.findOne({
    restaurantId: tenant.restaurantId,
    shiftName: payload.shiftName,
    isDeleted: false,
  });
  if (exists)
    throw new AppError("Shift name already exists", httpStatus.CONFLICT);

  return shiftRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    createdBy: user.id,
  });
};

const updateShift = async ({ id, payload, tenant, user }) => {
  const shift = await shiftRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!shift) throw new AppError("Shift not found", httpStatus.NOT_FOUND);

  if (payload.shiftName && payload.shiftName !== shift.shiftName) {
    const exists = await shiftRepository.findOne({
      _id: { $ne: id },
      restaurantId: tenant.restaurantId,
      shiftName: payload.shiftName,
      isDeleted: false,
    });
    if (exists)
      throw new AppError("Shift name already exists", httpStatus.CONFLICT);
  }

  return shiftRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteShift = async ({ id, tenant, user }) => {
  const shift = await shiftRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!shift) throw new AppError("Shift not found", httpStatus.NOT_FOUND);

  return shiftRepository.updateById(id, {
    isDeleted: true,
    status: "inactive",
    deletedAt: new Date(),
    deletedBy: user.id,
  });
};

const getShift = async ({ id, tenant }) => {
  const shift = await shiftRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false,
  });
  if (!shift) throw new AppError("Shift not found", httpStatus.NOT_FOUND);
  return shift;
};

const listShifts = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "shiftName"]);
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.search) filter.shiftName = { $regex: query.search, $options: "i" };

  const [items, total] = await shiftRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createShift,
  updateShift,
  deleteShift,
  getShift,
  listShifts,
};
