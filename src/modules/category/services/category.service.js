const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const { parsePagination, parseSort, paginationMeta } = require("../../../helpers/queryBuilder");
const categoryRepository = require("../repositories/category.repository");

const buildFilter = (query, tenant) => {
  const filter = { restaurantId: tenant.restaurantId, branchId: tenant.branchId, isDeleted: false };
  if (query.status) filter.status = query.status;
  if (query.search) filter.categoryName = { $regex: query.search, $options: "i" };
  return filter;
};

const createCategory = async ({ payload, tenant, user, file }) => {
  const exists = await categoryRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    categoryName: payload.categoryName,
    isDeleted: false
  });
  if (exists) throw new AppError("Category already exists", httpStatus.CONFLICT);

  return categoryRepository.create({
    ...payload,
    image: file ? file.location : payload.image,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id
  });
};

const updateCategory = async ({ id, payload, tenant, user, file }) => {
  const category = await categoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false
  });
  if (!category) throw new AppError("Category not found", httpStatus.NOT_FOUND);
  if (file) payload.image = file.location;
  return categoryRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteCategory = async ({ id, tenant, user }) => {
  const category = await categoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false
  });
  if (!category) throw new AppError("Category not found", httpStatus.NOT_FOUND);
  return categoryRepository.softDeleteById(id, user.id);
};

const getCategory = async ({ id, tenant }) => {
  const category = await categoryRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false
  });
  if (!category) throw new AppError("Category not found", httpStatus.NOT_FOUND);
  return category;
};

const listCategories = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt", "categoryName", "displayOrder", "status"]);
  const [items, total] = await categoryRepository.paginate({
    filter: buildFilter(query, tenant),
    sort,
    skip,
    limit
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = { createCategory, updateCategory, deleteCategory, getCategory, listCategories };
