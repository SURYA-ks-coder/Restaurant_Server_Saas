const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
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
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    loyaltyPoints: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    birthday: Date,
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

customerSchema.index(
  { restaurantId: 1, branchId: 1, mobileNumber: 1 },
  { unique: true },
);

module.exports = mongoose.model("Customer", customerSchema);
