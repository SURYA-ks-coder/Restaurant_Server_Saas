const BaseRepository = require("../../../repositories/BaseRepository");
const Customer = require("../Customer.model");

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }
}

module.exports = new CustomerRepository();
