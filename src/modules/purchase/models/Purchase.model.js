const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    inventoryItemName: { type: String, required: true, trim: true },
    unit: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const purchaseSchema = new mongoose.Schema(
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
    purchaseNumber: { type: String, required: true, trim: true, index: true },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    supplierName: { type: String, default: "", trim: true },
    invoiceNumber: { type: String, default: "", trim: true },
    purchaseDate: { type: Date, default: Date.now },
    items: {
      type: [purchaseItemSchema],
      validate: [(items) => items.length > 0, "At least one item is required"],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["received", "cancelled"],
      default: "received",
      index: true,
    },
    cancellationReason: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

purchaseSchema.index({ restaurantId: 1, branchId: 1, createdAt: -1 });

module.exports = mongoose.model("Purchase", purchaseSchema);
