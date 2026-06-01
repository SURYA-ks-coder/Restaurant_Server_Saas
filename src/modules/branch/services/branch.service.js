const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const { parsePagination, parseSort, paginationMeta } = require("../../../helpers/queryBuilder");
const branchRepository = require("../repositories/branch.repository");

const buildFilter = (query, tenant) => {
  const filter = { restaurantId: tenant.restaurantId, isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { branchName: { $regex: query.search, $options: "i" } },
      { branchCode: { $regex: query.search, $options: "i" } },
      { phone: { $regex: query.search, $options: "i" } }
    ];
  }
  return filter;
};

const createBranch = async ({ payload, tenant, user }) => {
  const exists = await branchRepository.findOne({
    restaurantId: tenant.restaurantId,
    code: payload.branchCode,
    isDeleted: false
  });
  if (exists) throw new AppError("Branch code already exists", httpStatus.CONFLICT);

  if (payload.isDefault) {
    await branchRepository.model.updateMany({ restaurantId: tenant.restaurantId }, { isDefault: false });
  }

  return branchRepository.create({
    ...payload,
    code: payload.branchCode,
    restaurantId: tenant.restaurantId,
    createdBy: user.id
  });
};

const updateBranch = async ({ id, payload, tenant, user }) => {
  const branch = await branchRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false
  });
  if (!branch) throw new AppError("Branch not found", httpStatus.NOT_FOUND);

  if (payload.branchCode && payload.branchCode !== branch.branchCode) {
    const exists = await branchRepository.findOne({
      _id: { $ne: id },
      restaurantId: tenant.restaurantId,
      code: payload.branchCode,
      isDeleted: false
    });
    if (exists) throw new AppError("Branch code already exists", httpStatus.CONFLICT);
    payload.code = payload.branchCode;
  }

  if (payload.isDefault) {
    await branchRepository.model.updateMany({ restaurantId: tenant.restaurantId }, { isDefault: false });
  }

  return branchRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteBranch = async ({ id, tenant, user }) => {
  const branch = await branchRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false
  });
  if (!branch) throw new AppError("Branch not found", httpStatus.NOT_FOUND);
  if (branch.isDefault) throw new AppError("Default branch cannot be deleted", httpStatus.BAD_REQUEST);
  return branchRepository.updateById(id, {
    isDeleted: true,
    status: "inactive",
    deletedAt: new Date(),
    deletedBy: user.id
  });
};

const getBranch = async ({ id, tenant }) => {
  const branch = await branchRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    isDeleted: false
  }).populate("manager", "name email phone role");
  if (!branch) throw new AppError("Branch not found", httpStatus.NOT_FOUND);
  return branch;
};

const listBranches = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "branchName", "branchCode"]);
  const [items, total] = await branchRepository.paginate({
    filter: buildFilter(query, tenant),
    sort,
    skip,
    limit,
    populate: [{ path: "manager", select: "name email phone role" }]
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = { createBranch, updateBranch, deleteBranch, getBranch, listBranches };
