const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
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
    expenseName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    expenseDate: { type: Date, required: true },
    paymentMode: {
      type: String,
      enum: ["cash", "card", "upi", "bank"],
      default: "cash",
    },
    notes: String,
    attachment: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expenseSchema);
