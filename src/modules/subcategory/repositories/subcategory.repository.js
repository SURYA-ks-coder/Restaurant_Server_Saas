const BaseRepository = require("../../../repositories/BaseRepository");
const Subcategory = require("../models/Subcategory.model");

class SubcategoryRepository extends BaseRepository {
  constructor() {
    super(Subcategory);
  }
}

module.exports = new SubcategoryRepository();
