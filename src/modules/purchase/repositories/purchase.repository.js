const BaseRepository = require("../../../repositories/BaseRepository");
const Purchase = require("../models/Purchase.model");

class PurchaseRepository extends BaseRepository {
  constructor() {
    super(Purchase);
  }
}

module.exports = new PurchaseRepository();
