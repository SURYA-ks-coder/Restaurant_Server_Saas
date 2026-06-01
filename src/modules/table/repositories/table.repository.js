const BaseRepository = require("../../../repositories/BaseRepository");
const DiningTable = require("../models/DiningTable.model");

class TableRepository extends BaseRepository {
  constructor() {
    super(DiningTable);
  }
}

module.exports = new TableRepository();
