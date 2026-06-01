const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
  {
    dineInPrice: { type: Number, required: true, min: 0 },
    parcelPrice: { type: Number, required: true, min: 0 },
    onlinePrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    itemName: { type: String, required: true, trim: true },
    itemCode: { type: String, required: true, trim: true, uppercase: true },
    barcode: { type: String, trim: true },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      index: true,
    },
    description: { type: String, trim: true },
    prices: { type: priceSchema, required: true },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    itemType: {
      type: String,
      enum: ["veg", "non_veg", "egg", "beverage"],
      required: true,
    },
    foodType: {
      type: String,
      enum: ["food", "drink", "dessert", "addon", "starter", "main"],
      default: "food",
    },
    spicyLevel: {
      type: String,
      enum: ["mild", "medium", "hot", "extra_hot"],
      index: true,
    },
    kitchenSection: { type: String, trim: true, index: true },
    preparationTime: { type: Number, default: 0, min: 0 },
    image: String,
    stockEnabled: { type: Boolean, default: false },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0, min: 0 },
    unitType: {
      type: String,
      enum: ["plate", "bowl", "glass", "piece"],
      default: "plate",
    },
    prepTime: { type: Number, default: 0, min: 0 },
    gstPercentage: { type: Number, default: 0, min: 0, max: 100 },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

menuItemSchema.index(
  { restaurantId: 1, branchId: 1, itemCode: 1, isDeleted: 1 },
  { unique: true },
);
menuItemSchema.index({ itemName: "text", itemCode: "text", barcode: "text" });

module.exports = mongoose.model("MenuItem", menuItemSchema);
