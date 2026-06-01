const BaseRepository = require("../../../repositories/BaseRepository");
const RestaurantSubscription = require("../models/RestaurantSubscription.model");

class RestaurantSubscriptionRepository extends BaseRepository {
  constructor() {
    super(RestaurantSubscription);
  }

  findCurrent(restaurantId) {
    return RestaurantSubscription.findOne({
      restaurantId,
      status: { $in: ["trialing", "active", "past_due"] }
    }).sort({ createdAt: -1 });
  }
}

module.exports = new RestaurantSubscriptionRepository();
