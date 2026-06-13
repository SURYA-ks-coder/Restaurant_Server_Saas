const BaseRepository = require("../../../repositories/BaseRepository");
const Shift = require("../models/Shift.model");

class ShiftRepository extends BaseRepository {
  constructor() {
    super(Shift);
  }
}

module.exports = new ShiftRepository();
