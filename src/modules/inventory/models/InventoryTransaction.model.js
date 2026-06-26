const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["purchase", "usage", "adjustment", "return", "wastage", "transfer_out", "transfer_in"],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ["manual", "kot", "wastage", "transfer"],
      default: "manual",
    },
    quantity: { type: Number, required: true },
    previousQuantity: { type: Number, required: true },
    updatedQuantity: { type: Number, required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema,
);
