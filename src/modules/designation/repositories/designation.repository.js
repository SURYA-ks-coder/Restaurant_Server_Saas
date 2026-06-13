const BaseRepository = require("../../../repositories/BaseRepository");
const Designation = require("../models/Designation.model");

class DesignationRepository extends BaseRepository {
  constructor() {
    super(Designation);
  }
}

module.exports = new DesignationRepository();
