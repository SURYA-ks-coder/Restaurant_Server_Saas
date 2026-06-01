const BaseRepository = require("../../../repositories/BaseRepository");
const Role = require("../models/Role.model");

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }
}

module.exports = new RoleRepository();
