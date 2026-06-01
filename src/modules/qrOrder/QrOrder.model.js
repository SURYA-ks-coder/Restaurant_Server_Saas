const mongoose = require("mongoose");

const qrOrderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    itemName: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const qrOrderSchema = new mongoose.Schema(
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
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningTable" },
    customerName: String,
    sessionToken: { type: String, required: true, index: true },
    orderNo: { type: String, required: true },
    items: [qrOrderItemSchema],
    subTotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    payments: [
      {
        method: { type: String, required: true },
        amount: { type: Number, required: true },
        transactionRef: String,
        paidAt: { type: Date, default: Date.now },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "confirmed", "prepared", "completed", "cancelled"],
      default: "pending",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

qrOrderSchema.index(
  { restaurantId: 1, branchId: 1, orderNo: 1 },
  { unique: true },
);

module.exports = mongoose.model("QrOrder", qrOrderSchema);
