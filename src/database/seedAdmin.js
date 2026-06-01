const connectDatabase = require("./connection");
const Restaurant = require("../modules/restaurant/models/Restaurant.model");
const Branch = require("../modules/branch/models/Branch.model");
const User = require("../modules/auth/models/User.model");

const seed = async () => {
  await connectDatabase();

  const restaurant = await Restaurant.findOneAndUpdate(
    { slug: "demo-restaurant" },
    { name: "Demo Restaurant", slug: "demo-restaurant", status: "active" },
    { upsert: true, new: true }
  );

  const branch = await Branch.findOneAndUpdate(
    { restaurantId: restaurant._id, code: "MAIN" },
    { restaurantId: restaurant._id, branchName: "Main Branch", code: "MAIN", isDefault: true, status: "active" },
    { upsert: true, new: true }
  );

  const exists = await User.findOne({ restaurantId: restaurant._id, email: "owner@example.com" });
  if (!exists) {
    await User.create({
      restaurantId: restaurant._id,
      branchIds: [branch._id],
      defaultBranchId: branch._id,
      name: "Demo Owner",
      email: "owner@example.com",
      password: "Password@123",
      role: "owner",
      permissions: [
        "category:read",
        "category:create",
        "category:update",
        "category:delete",
        "subcategory:read",
        "subcategory:create",
        "subcategory:update",
        "subcategory:delete",
        "menu:read",
        "menu:create",
        "menu:update",
        "menu:delete"
      ]
    });
  }

  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
