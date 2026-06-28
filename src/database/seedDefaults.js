const Role = require("../modules/role/models/Role.model");
const Category = require("../modules/category/models/Category.model");
const Subcategory = require("../modules/subcategory/models/Subcategory.model");
const MenuItem = require("../modules/menuItem/models/MenuItem.model");

// Menu IDs from menuList.js:
// 1=Dashboard, 2=Sales, 3=POS Ordering, 4=Orders, 5=Billing,
// 6=Restaurant, 7=Tables, 8=Kitchen KOT, 9=Menus, 10=QR Orders,
// 11=Inventory & Finance, 12=Inventory, 13=Expenses,
// 14=Administration, 15=Staff, 16=Reports, 17=Restaurant Profile,
// 18=Settings, 19=Privileges

const DEFAULT_ROLES = [
  {
    roleName: "Owner",
    menus: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
    permissions: [],
  },
  {
    roleName: "Super Admin",
    menus: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
    permissions: [],
  },
  {
    roleName: "Staff",
    menus: [1, 3, 4, 5, 7, 8, 9, 10],
    permissions: [
      "pos:read",
      "pos:create",
      "kot:read",
      "table:read",
      "reservation:read",
      "menu:read",
      "category:read",
      "subcategory:read",
    ],
  },
  {
    roleName: "Manager",
    menus: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16],
    permissions: [
      "restaurant:read",
      "branch:read",
      "category:read",
      "category:create",
      "category:update",
      "subcategory:read",
      "subcategory:create",
      "subcategory:update",
      "menu:read",
      "menu:create",
      "menu:update",
      "table:read",
      "table:create",
      "table:update",
      "table:delete",
      "reservation:read",
      "reservation:create",
      "reservation:update",
      "reservation:delete",
      "pos:read",
      "pos:create",
      "kot:read",
      "kot:update",
      "inventory:read",
      "inventory:create",
      "inventory:update",
      "reports:read",
      "staff:read",
      "staff:create",
      "staff:update",
      "role:read",
    ],
  },
  {
    roleName: "Chef",
    menus: [1, 4, 8, 9],
    permissions: [
      "kot:read",
      "kot:update",
      "menu:read",
      "category:read",
      "subcategory:read",
      "inventory:read",
    ],
  },
  {
    roleName: "Server",
    menus: [1, 3, 4, 7, 9, 10],
    permissions: [
      "pos:read",
      "pos:create",
      "table:read",
      "reservation:read",
      "menu:read",
      "category:read",
      "subcategory:read",
      "kot:read",
    ],
  },
  {
    roleName: "Cashier",
    menus: [1, 2, 3, 4, 5, 7, 9, 16],
    permissions: [
      "pos:read",
      "pos:create",
      "table:read",
      "reservation:read",
      "menu:read",
      "category:read",
      "subcategory:read",
      "reports:read",
    ],
  },
];

const CATEGORY_SEEDS = [
  { categoryName: "Starters", displayOrder: 1 },
  { categoryName: "Main Course", displayOrder: 2 },
  { categoryName: "Beverages", displayOrder: 3 },
  { categoryName: "Desserts", displayOrder: 4 },
];

const SUBCATEGORY_SEEDS = [
  { categoryName: "Starters", subCategoryName: "Veg Starters" },
  { categoryName: "Starters", subCategoryName: "Non-Veg Starters" },
  { categoryName: "Main Course", subCategoryName: "Veg Main" },
  { categoryName: "Main Course", subCategoryName: "Non-Veg Main" },
  { categoryName: "Beverages", subCategoryName: "Hot Drinks" },
  { categoryName: "Beverages", subCategoryName: "Cold Drinks" },
  { categoryName: "Desserts", subCategoryName: "Ice Cream" },
  { categoryName: "Desserts", subCategoryName: "Sweets" },
];

const MENU_ITEM_SEEDS = [
  {
    itemName: "Veg Spring Roll",
    itemCode: "VSR001",
    categoryKey: "Starters",
    subcategoryKey: "Veg Starters",
    prices: { dineInPrice: 120, parcelPrice: 130, onlinePrice: 140 },
    itemType: "veg",
    foodType: "starter",
    preparationTime: 10,
  },
  {
    itemName: "Chicken Tikka",
    itemCode: "CT001",
    categoryKey: "Starters",
    subcategoryKey: "Non-Veg Starters",
    prices: { dineInPrice: 220, parcelPrice: 240, onlinePrice: 260 },
    itemType: "non_veg",
    foodType: "starter",
    preparationTime: 15,
  },
  {
    itemName: "Paneer Butter Masala",
    itemCode: "PBM001",
    categoryKey: "Main Course",
    subcategoryKey: "Veg Main",
    prices: { dineInPrice: 220, parcelPrice: 240, onlinePrice: 260 },
    itemType: "veg",
    foodType: "main",
    preparationTime: 20,
  },
  {
    itemName: "Butter Chicken",
    itemCode: "BC001",
    categoryKey: "Main Course",
    subcategoryKey: "Non-Veg Main",
    prices: { dineInPrice: 280, parcelPrice: 300, onlinePrice: 320 },
    itemType: "non_veg",
    foodType: "main",
    preparationTime: 20,
  },
  {
    itemName: "Masala Chai",
    itemCode: "MCH001",
    categoryKey: "Beverages",
    subcategoryKey: "Hot Drinks",
    prices: { dineInPrice: 30, parcelPrice: 35, onlinePrice: 40 },
    itemType: "beverage",
    foodType: "drink",
    preparationTime: 5,
  },
  {
    itemName: "Fresh Lime Soda",
    itemCode: "FLS001",
    categoryKey: "Beverages",
    subcategoryKey: "Cold Drinks",
    prices: { dineInPrice: 60, parcelPrice: 65, onlinePrice: 70 },
    itemType: "beverage",
    foodType: "drink",
    preparationTime: 5,
  },
  {
    itemName: "Vanilla Ice Cream",
    itemCode: "VIC001",
    categoryKey: "Desserts",
    subcategoryKey: "Ice Cream",
    prices: { dineInPrice: 80, parcelPrice: 85, onlinePrice: 90 },
    itemType: "veg",
    foodType: "dessert",
    preparationTime: 3,
  },
  {
    itemName: "Gulab Jamun",
    itemCode: "GJ001",
    categoryKey: "Desserts",
    subcategoryKey: "Sweets",
    prices: { dineInPrice: 60, parcelPrice: 65, onlinePrice: 70 },
    itemType: "veg",
    foodType: "dessert",
    preparationTime: 5,
  },
];

const seedRestaurantDefaults = async ({ restaurantId, branchId, ownerId }) => {
  // 1. Seed all default roles (upsert by roleName)
  const existingRoleNames = await Role.find({ restaurantId }).distinct("roleName");
  const existingSet = new Set(existingRoleNames);

  const rolesToCreate = DEFAULT_ROLES.filter((r) => !existingSet.has(r.roleName));
  if (rolesToCreate.length > 0) {
    await Role.insertMany(
      rolesToCreate.map((r) => ({
        restaurantId,
        roleName: r.roleName,
        menus: r.menus,
        permissions: r.permissions,
        status: "active",
      })),
    );
  }

  // Skip category/item seeding if already done for this branch
  const alreadySeeded = await Category.countDocuments({ restaurantId, branchId, isDeleted: false });
  if (alreadySeeded > 0) return;

  // 2. Default categories
  const categoryDocs = CATEGORY_SEEDS.map((cat) => ({
    restaurantId,
    branchId,
    categoryName: cat.categoryName,
    displayOrder: cat.displayOrder,
    status: "active",
    createdBy: ownerId,
  }));
  const createdCategories = await Category.insertMany(categoryDocs);

  const categoryMap = {};
  createdCategories.forEach((cat) => { categoryMap[cat.categoryName] = cat._id; });

  // 3. Default subcategories
  const subcategoryDocs = SUBCATEGORY_SEEDS.map((sub) => ({
    restaurantId,
    branchId,
    categoryId: categoryMap[sub.categoryName],
    subCategoryName: sub.subCategoryName,
    status: "active",
    createdBy: ownerId,
  }));
  const createdSubcategories = await Subcategory.insertMany(subcategoryDocs);

  const subcategoryMap = {};
  createdSubcategories.forEach((sub) => { subcategoryMap[sub.subCategoryName] = sub._id; });

  // 4. Default menu items
  const menuItemDocs = MENU_ITEM_SEEDS.map((item) => ({
    restaurantId,
    branchId,
    itemName: item.itemName,
    itemCode: item.itemCode,
    categoryId: categoryMap[item.categoryKey],
    subCategoryId: subcategoryMap[item.subcategoryKey],
    prices: item.prices,
    itemType: item.itemType,
    foodType: item.foodType,
    preparationTime: item.preparationTime,
    status: "active",
    availabilityStatus: "available",
    createdBy: ownerId,
  }));
  await MenuItem.insertMany(menuItemDocs);
};

module.exports = { seedRestaurantDefaults, DEFAULT_ROLES };
