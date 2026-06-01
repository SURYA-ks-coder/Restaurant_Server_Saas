const BaseRepository = require("../../../repositories/BaseRepository");
const Kot = require("../models/Kot.model");

class KotRepository extends BaseRepository {
  constructor() {
    super(Kot);
  }
}

module.exports = new KotRepository();
