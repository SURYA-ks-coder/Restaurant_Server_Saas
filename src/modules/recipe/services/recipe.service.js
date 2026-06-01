const httpStatus = require("http-status");
const AppError = require("../../../utils/AppError");
const {
  parsePagination,
  parseSort,
  paginationMeta,
} = require("../../../helpers/queryBuilder");
const recipeRepository = require("../repositories/recipe.repository");
const inventoryRepository = require("../../inventory/repositories/inventory.repository");
const menuItemRepository = require("../../menuItem/repositories/menuItem.repository");

const validateIngredients = async (ingredients, tenant) => {
  for (const ingredient of ingredients) {
    const inventoryItem = await inventoryRepository.findOne({
      _id: ingredient.inventoryItemId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    });
    if (!inventoryItem)
      throw new AppError(
        "Inventory ingredient not found",
        httpStatus.NOT_FOUND,
      );
  }
};

const createRecipe = async ({ payload, tenant, user }) => {
  const menuItem = await menuItemRepository.findOne({
    _id: payload.menuItemId,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
  });
  if (!menuItem)
    throw new AppError("Menu item not found", httpStatus.NOT_FOUND);

  await validateIngredients(payload.ingredients, tenant);

  const exists = await recipeRepository.findOne({
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    menuItemId: payload.menuItemId,
    isDeleted: false,
  });
  if (exists)
    throw new AppError(
      "Recipe already exists for this menu item",
      httpStatus.CONFLICT,
    );

  return recipeRepository.create({
    ...payload,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    createdBy: user.id,
  });
};

const updateRecipe = async ({ id, payload, tenant, user }) => {
  const recipe = await recipeRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!recipe) throw new AppError("Recipe not found", httpStatus.NOT_FOUND);

  if (payload.menuItemId) {
    const menuItem = await menuItemRepository.findOne({
      _id: payload.menuItemId,
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
    });
    if (!menuItem)
      throw new AppError("Menu item not found", httpStatus.NOT_FOUND);
  }

  if (payload.ingredients)
    await validateIngredients(payload.ingredients, tenant);
  return recipeRepository.updateById(id, { ...payload, updatedBy: user.id });
};

const deleteRecipe = async ({ id, tenant, user }) => {
  const recipe = await recipeRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!recipe) throw new AppError("Recipe not found", httpStatus.NOT_FOUND);
  return recipeRepository.updateById(id, {
    isDeleted: true,
    deletedAt: new Date(),
    updatedBy: user.id,
  });
};

const getRecipe = async ({ id, tenant }) => {
  const recipe = await recipeRepository.findOne({
    _id: id,
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  });
  if (!recipe) throw new AppError("Recipe not found", httpStatus.NOT_FOUND);
  return recipe;
};

const listRecipes = async ({ query, tenant }) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, ["createdAt"]);
  const filter = {
    restaurantId: tenant.restaurantId,
    branchId: tenant.branchId,
    isDeleted: false,
  };
  if (query.menuItemId) filter.menuItemId = query.menuItemId;
  const [items, total] = await recipeRepository.paginate({
    filter,
    sort,
    skip,
    limit,
  });
  return { items, meta: paginationMeta({ total, page, limit }) };
};

module.exports = {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
};
