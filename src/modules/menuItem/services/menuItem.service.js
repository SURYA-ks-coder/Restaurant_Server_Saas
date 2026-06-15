const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const categoryRepository = require("../../category/repositories/category.repository");
const subcategoryRepository = require("../../subcategory/repositories/subcategory.repository");
const repository = require("../repositories/menuItem.repository");

const buildFilter = (query, tenant) => {
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.status) filter.status = query.status;
  if (query.availabilityStatus)
    filter.availabilityStatus = query.availabilityStatus;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.subCategoryId) filter.subCategoryId = query.subCategoryId;
  if (query.itemType) filter.itemType = query.itemType;
  if (query.foodType) filter.foodType = query.foodType;
  if (query.kitchenSection) filter.kitchenSection = query.kitchenSection;
  if (query.stockEnabled !== undefined)
    filter.stockEnabled = query.stockEnabled;
  if (query.lowStock === true)
    filter.$expr = { $lte: ["$currentStock", "$minimumStock"] };
  if (query.search) {
    filter.$or = [
      { itemName: { $regex: query.search, $options: "i" } },
      { itemCode: { $regex: query.search, $options: "i" } },
      { barcode: { $regex: query.search, $options: "i" } },
    ];
  }
  return filter;
};

const ensureCategoryTree = async ({ categoryId, subCategoryId, tenant }) => {
  const category = await categoryRepository.findOne({
    _id: categoryId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!category) throw new AppError("Category not found", httpStatus.NOT_FOUND);
  if (subCategoryId) {
    const subcategory = await subcategoryRepository.findOne({
      _id: subCategoryId,
      categoryId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      isDeleted: false,
    });
    if (!subcategory)
      throw new AppError(
        "Subcategory not found under selected category",
        httpStatus.NOT_FOUND,
      );
  }
};

const normalizePayload = (payload, file) => {
  const data = { ...payload };
  data.prices = {
    dineInPrice: payload.dineInPrice,
    parcelPrice: payload.parcelPrice,
    onlinePrice: payload.onlinePrice,
    discountPrice: payload.discountPrice,
  };
  delete data.dineInPrice;
  delete data.parcelPrice;
  delete data.onlinePrice;
  delete data.discountPrice;
  if (file) data.image = file.location;
  return data;
};

const createMenuItem = async ({ payload, tenant, user, file }) => {
  await ensureCategoryTree({
    categoryId: payload.categoryId,
    subCategoryId: payload.subCategoryId,
    tenant,
  });
  const exists = await repository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    itemCode: payload.itemCode.toUpperCase(),
    isDeleted: false,
  });
  if (exists)
    throw new AppError("Item code already exists", httpStatus.CONFLICT);
  return repository.create({
    ...normalizePayload(payload, file),
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateMenuItem = async ({ id, payload, tenant, user, file }) => {
  const menuItem = await repository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!menuItem)
    throw new AppError("Menu item not found", httpStatus.NOT_FOUND);
  if (payload.categoryId || payload.subCategoryId) {
    await ensureCategoryTree({
      categoryId: payload.categoryId || menuItem.categoryId,
      subCategoryId: payload.subCategoryId || menuItem.subCategoryId,
      tenant,
    });
  }
  return repository.updateById(id, {
    ...normalizePayload(payload, file),
    updatedBy: user.id,
  });
};

const deleteMenuItem = async ({ id, tenant, user }) => {
  const menuItem = await repository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!menuItem)
    throw new AppError("Menu item not found", httpStatus.NOT_FOUND);
  return repository.softDeleteById(id, user.id);
};

const getMenuItem = async ({ id, tenant }) => {
  const menuItem = await repository
    .findOne({
      _id: id,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      isDeleted: false,
    })
    .populate("categoryId", "categoryName")
    .populate("subCategoryId", "subCategoryName");
  if (!menuItem)
    throw new AppError("Menu item not found", httpStatus.NOT_FOUND);
  return menuItem;
};

const listMenuItems = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, [
    "createdAt",
    "itemName",
    "itemCode",
    "currentStock",
    "status",
  ]);
  const [items, total] = await repository.paginate({
    filter: buildFilter(query, tenant),
    sort,
    skip,
    limit,
    populate: [
      { path: "categoryId", select: "categoryName" },
      { path: "subCategoryId", select: "subCategoryName" },
    ],
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

const updateAvailability = async ({ id, availabilityStatus, tenant, user }) => {
  await getMenuItem({ id, tenant });
  return repository.updateById(id, { availabilityStatus, updatedBy: user.id });
};

const updatePrices = async ({ id, payload, tenant, user }) => {
  await getMenuItem({ id, tenant });
  return repository.updateById(id, {
    prices: payload,
    updatedBy: user.id,
  });
};

const lowStockAlerts = async (tenant) => repository.findLowStock(tenant);

module.exports = {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItem,
  listMenuItems,
  updateAvailability,
  updatePrices,
  lowStockAlerts,
};
