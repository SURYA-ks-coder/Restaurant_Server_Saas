const BaseRepository = require("../../../repositories/BaseRepository");
const Wastage = require("../models/Wastage.model");

class WastageRepository extends BaseRepository {
  constructor() {
    super(Wastage);
  }
}

module.exports = new WastageRepository();
