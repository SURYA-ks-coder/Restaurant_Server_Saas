const mongoose = require("mongoose");

const tableReservationSchema = new mongoose.Schema(
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
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiningTable",
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    guestCount: { type: Number, required: true, min: 1 },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"],
      default: "pending",
      index: true,
    },
    source: {
      type: String,
      enum: ["walk_in", "phone", "online", "staff"],
      default: "staff",
    },
    specialRequest: { type: String, trim: true, maxlength: 1000 },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

tableReservationSchema.index({ restaurantId: 1, branchId: 1, tableId: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("TableReservation", tableReservationSchema);
