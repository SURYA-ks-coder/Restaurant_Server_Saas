const BaseRepository = require("../../../repositories/BaseRepository");
const StockTransfer = require("../models/StockTransfer.model");

class StockTransferRepository extends BaseRepository {
  constructor() {
    super(StockTransfer);
  }
}

module.exports = new StockTransferRepository();
