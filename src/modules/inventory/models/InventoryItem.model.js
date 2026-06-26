const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
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
    materialName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    supplier: { type: String, trim: true },
    unit: { type: String, required: true, trim: true },
    stockQuantity: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
