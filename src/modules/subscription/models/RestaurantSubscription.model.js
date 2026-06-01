const mongoose = require("mongoose");
const tenantScopePlugin = require("../../../plugins/tenantScope.plugin");

const restaurantSubscriptionSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    planName: { type: String, required: true, trim: true },
    billingCycle: { type: String, enum: ["trial", "monthly", "yearly", "custom"], required: true },
    price: { type: Number, min: 0, default: 0 },
    startsAt: { type: Date, required: true, default: Date.now },
    expiresAt: Date,
    trialStartDate: Date,
    trialEndDate: Date,
    status: {
      type: String,
      enum: ["trialing", "active", "expired", "cancelled", "past_due"],
      default: "active",
      index: true
    },
    limitsSnapshot: {
      maxBranches: { type: Number, default: 1 },
      maxUsers: { type: Number, default: 3 },
      maxOrders: { type: Number, default: 100 }
    },
    featuresSnapshot: [{ type: String, trim: true }],
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

restaurantSubscriptionSchema.index({ restaurantId: 1, status: 1 });
restaurantSubscriptionSchema.index({ expiresAt: 1 });
restaurantSubscriptionSchema.plugin(tenantScopePlugin);

module.exports = mongoose.model("RestaurantSubscription", restaurantSubscriptionSchema);
