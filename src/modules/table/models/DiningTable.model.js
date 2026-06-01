const mongoose = require("mongoose");

const diningTableSchema = new mongoose.Schema(
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
    tableName: { type: String, required: true, trim: true },
    tableNumber: { type: String, required: true, trim: true, index: true },
    capacity: { type: Number, default: 2 },
    floor: { type: String, trim: true },
    qrCode: { type: String, trim: true },
    qrCodeDataUrl: { type: String },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DiningTable", diningTableSchema);
