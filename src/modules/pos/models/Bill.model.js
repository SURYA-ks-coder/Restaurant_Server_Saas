const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    itemName: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const billSchema = new mongoose.Schema(
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
    billNo: { type: String, required: true },
    orderType: {
      type: String,
      enum: ["dine_in", "parcel", "online", "qr"],
      required: true,
    },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningTable" },
    tableName: String,
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    items: [billItemSchema],
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    note: { type: String, trim: true },
    subTotal: { type: Number, required: true },
    taxTotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    payments: [
      {
        method: {
          type: String,
          enum: ["cash", "card", "upi", "bank", "split"],
          default: "cash",
        },
        amount: { type: Number, required: true, min: 0 },
        transactionRef: String,
        paidAt: Date,
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["open", "held", "completed", "cancelled"],
      default: "open",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

billSchema.index({ restaurantId: 1, branchId: 1, billNo: 1 }, { unique: true });

module.exports = mongoose.model("Bill", billSchema);
