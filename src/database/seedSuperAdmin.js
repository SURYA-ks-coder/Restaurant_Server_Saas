require("dotenv").config();
const connectDatabase = require("./connection");
const Restaurant = require("../modules/restaurant/models/Restaurant.model");
const Branch = require("../modules/branch/models/Branch.model");
const User = require("../modules/auth/models/User.model");

// ── Change these before running ──────────────────────────────────────────────
const ADMIN_NAME     = "Product Owner";
const ADMIN_EMAIL    = "admin@flavorhub.com";
const ADMIN_PASSWORD = "Admin@1234";          // min 8 chars, change after first login
// ─────────────────────────────────────────────────────────────────────────────

const seed = async () => {
  await connectDatabase();

  // 1. Platform restaurant (acts as the super-admin's tenant)
  const restaurant = await Restaurant.findOneAndUpdate(
    { slug: "flavorhub-platform" },
    {
      name: "FlavorHub Platform",
      slug: "flavorhub-platform",
      status: "active",
      setupStatus: "completed",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 2. Default branch for the platform restaurant
  const branch = await Branch.findOneAndUpdate(
    { restaurantId: restaurant._id, code: "HQ" },
    {
      restaurantId: restaurant._id,
      branchName: "Headquarters",
      code: "HQ",
      isDefault: true,
      status: "active",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 3. Super admin user (idempotent — skip if already exists)
  const exists = await User.findOne({
    restaurantId: restaurant._id,
    email: ADMIN_EMAIL,
  });

  if (exists) {
    console.log(`Super admin already exists → ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      restaurantId:    restaurant._id,
      branchIds:       [branch._id],
      defaultBranchId: branch._id,
      name:            ADMIN_NAME,
      email:           ADMIN_EMAIL,
      password:        ADMIN_PASSWORD,   // hashed by User pre-save hook
      role:            "super_admin",
      status:          "active",
      permissions:     [],               // super_admin bypasses permission checks
    });
    console.log("✓ Super admin created");
    console.log(`  Email    : ${ADMIN_EMAIL}`);
    console.log(`  Password : ${ADMIN_PASSWORD}`);
    console.log("  ⚠  Change the password after first login!");
  }

  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
