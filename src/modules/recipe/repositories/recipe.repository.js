const BaseRepository = require("../../../repositories/BaseRepository");
const Recipe = require("../../inventory/models/Recipe.model");

class RecipeRepository extends BaseRepository {
  constructor() {
    super(Recipe);
  }
}

module.exports = new RecipeRepository();
