const BaseRepository = require("../../../repositories/BaseRepository");
const Bill = require("../models/Bill.model");

class PosRepository extends BaseRepository {
  constructor() {
    super(Bill);
  }
}

module.exports = new PosRepository();
