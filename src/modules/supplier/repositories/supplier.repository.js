const BaseRepository = require("../../../repositories/BaseRepository");
const Supplier = require("../models/supplier.model");

class SupplierRepository extends BaseRepository {
  constructor() {
    super(Supplier);
  }
}

module.exports = new SupplierRepository();
