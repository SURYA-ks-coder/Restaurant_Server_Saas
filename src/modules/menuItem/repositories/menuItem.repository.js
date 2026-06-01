const BaseRepository = require("../../../repositories/BaseRepository");
const MenuItem = require("../models/MenuItem.model");

class MenuItemRepository extends BaseRepository {
  constructor() {
    super(MenuItem);
  }

  findLowStock(tenant) {
    return this.model.find({
      restaurantId: tenant.restaurantId,
      branchId: tenant.branchId,
      stockEnabled: true,
      isDeleted: false,
      $expr: { $lte: ["$currentStock", "$minimumStock"] }
    });
  }
}

module.exports = new MenuItemRepository();
