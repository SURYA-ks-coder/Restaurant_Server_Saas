const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    billingCycle: {
      type: String,
      enum: ["trial", "monthly", "yearly", "custom"],
      required: true,
      default: "monthly"
    },
    trialDays: { type: Number, min: 0, default: 0 },
    maxBranches: { type: Number, min: 0, default: 1 },
    maxUsers: { type: Number, min: 0, default: 3 },
    maxOrders: { type: Number, min: 0, default: 100 },
    features: [{ type: String, trim: true }],
    status: { type: String, enum: ["active", "inactive", "archived"], default: "active", index: true },
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ status: 1, billingCycle: 1 });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
