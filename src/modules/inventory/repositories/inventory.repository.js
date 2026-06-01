const BaseRepository = require("../../../repositories/BaseRepository");
const InventoryItem = require("../models/InventoryItem.model");

class InventoryRepository extends BaseRepository {
  constructor() {
    super(InventoryItem);
  }
}

module.exports = new InventoryRepository();
