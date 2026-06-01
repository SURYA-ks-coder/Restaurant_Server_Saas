const httpStatus = require("http-status");
const asyncHandler = require("../../../utils/asyncHandler");
const { sendSuccess } = require("../../../helpers/apiResponse");
const recipeService = require("../services/recipe.service");

const create = asyncHandler(async (req, res) => {
  const data = await recipeService.createRecipe({
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, {
    statusCode: httpStatus.CREATED,
    message: "Recipe created",
    data,
  });
});

const update = asyncHandler(async (req, res) => {
  const data = await recipeService.updateRecipe({
    id: req.params.id,
    payload: req.body,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Recipe updated", data });
});

const remove = asyncHandler(async (req, res) => {
  await recipeService.deleteRecipe({
    id: req.params.id,
    tenant: req.tenant,
    user: req.user,
  });
  sendSuccess(res, { message: "Recipe deleted" });
});

const get = asyncHandler(async (req, res) => {
  const data = await recipeService.getRecipe({
    id: req.params.id,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Recipe fetched", data });
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await recipeService.listRecipes({
    query: req.query,
    tenant: req.tenant,
  });
  sendSuccess(res, { message: "Recipes fetched", data: items, meta });
});

module.exports = { create, update, remove, get, list };
