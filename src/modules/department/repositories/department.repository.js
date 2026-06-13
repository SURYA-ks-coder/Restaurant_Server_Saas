const BaseRepository = require("../../../repositories/BaseRepository");
const Department = require("../models/Department.model");

class DepartmentRepository extends BaseRepository {
  constructor() {
    super(Department);
  }
}

module.exports = new DepartmentRepository();
