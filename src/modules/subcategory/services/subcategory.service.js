const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const categoryRepository = require("../../category/repositories/category.repository");
const repository = require("../repositories/subcategory.repository");

const buildFilter = (query, tenant) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.status) filter.status = query.status;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.search)
    filter.subCategoryName = { $regex: query.search, $options: "i" };
  return filter;
};

const ensureCategory = async (categoryId, tenant) => {
  const category = await categoryRepository.findOne({
    _id: categoryId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!category) throw new AppError("Category not found", httpStatus.NOT_FOUND);
};

const createSubcategory = async ({ payload, tenant, user }) => {
  await ensureCategory(payload.categoryId, tenant);
  const exists = await repository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    categoryId: payload.categoryId,
    subCategoryName: payload.subCategoryName,
    isDeleted: false,
  });
  if (exists)
    throw new AppError("Subcategory already exists", httpStatus.CONFLICT);
  return repository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateSubcategory = async ({ id, payload, tenant, user }) => {
  const subcategory = await repository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!subcategory)
    throw new AppError("Subcategory not found", httpStatus.NOT_FOUND);
  if (payload.categoryId) await ensureCategory(payload.categoryId, tenant);
  return repository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteSubcategory = async ({ id, tenant, user }) => {
  const subcategory = await repository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!subcategory)
    throw new AppError("Subcategory not found", httpStatus.NOT_FOUND);
  return repository.softDeleteById(id, user.id);
};

const getSubcategory = async ({ id, tenant }) => {
  const subcategory = await repository
    .findOne({
      _id: id,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      isDeleted: false,
    })
    .populate("categoryId", "categoryName");
  if (!subcategory)
    throw new AppError("Subcategory not found", httpStatus.NOT_FOUND);
  return subcategory;
};

const listSubcategories = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "subCategoryName", "status"]);
  const [items, total] = await repository.paginate({
    filter: buildFilter(query, tenant),
    sort,
    skip,
    limit,
    populate: [{ path: "categoryId", select: "categoryName" }],
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategory,
  listSubcategories,
};
