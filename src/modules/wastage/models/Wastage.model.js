const mongoose = require("mongoose");

const wastageSchema = new mongoose.Schema(
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
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },
    inventoryItemName: { type: String },
    unit: { type: String },
    quantity: { type: Number, required: true, min: 0.001 },
    reason: {
      type: String,
      enum: ["expired", "spoiled", "damaged", "overcooked", "spilled", "other"],
      required: true,
    },
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wastage", wastageSchema);
