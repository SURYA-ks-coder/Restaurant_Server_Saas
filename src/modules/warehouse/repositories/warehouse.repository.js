const BaseRepository = require("../../../repositories/BaseRepository");
const Warehouse = require("../models/Warehouse.model");

class WarehouseRepository extends BaseRepository {
  constructor() {
    super(Warehouse);
  }
}

module.exports = new WarehouseRepository();
