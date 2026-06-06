const mongoose = require("mongoose");

const kotSchema = new mongoose.Schema(
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
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true,
    },
    kitchenSection: { type: String, required: true, trim: true },
    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        itemName: String,
        quantity: Number,
        note: String,
        status: {
          type: String,
          enum: ["pending", "preparing", "ready", "served"],
          default: "pending",
        },
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    chefId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chefName: String,
    preparationStartedAt: Date,
    readyAt: Date,
    notes: String,
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "cancelled"],
      default: "pending",
    },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    tableName: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Kot", kotSchema);
