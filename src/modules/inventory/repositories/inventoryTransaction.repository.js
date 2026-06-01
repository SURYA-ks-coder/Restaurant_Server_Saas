const BaseRepository = require("../../../repositories/BaseRepository");
const InventoryTransaction = require("../models/InventoryTransaction.model");

class InventoryTransactionRepository extends BaseRepository {
  constructor() {
    super(InventoryTransaction);
  }
}

module.exports = new InventoryTransactionRepository();
