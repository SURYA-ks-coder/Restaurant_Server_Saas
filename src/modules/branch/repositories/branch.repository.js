const BaseRepository = require("../../../repositories/BaseRepository");
const Branch = require("../models/Branch.model");

class BranchRepository extends BaseRepository {
  constructor() {
    super(Branch);
  }
}

module.exports = new BranchRepository();
