const BaseRepository = require("../../../repositories/BaseRepository");
const Category = require("../models/Category.model");

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }
}

module.exports = new CategoryRepository();
