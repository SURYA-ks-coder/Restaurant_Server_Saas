const mongoose = require("mongoose");

const onboardingStepSchema = new mongoose.Schema(
  {
    restaurantProfile: { type: Boolean, default: false },
    gstDetails: { type: Boolean, default: false },
    logo: { type: Boolean, default: false },
    branch: { type: Boolean, default: false },
    subscription: { type: Boolean, default: false },
    domain: { type: Boolean, default: false },
  },
  { _id: false },
);

const restaurantSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: String,
    ownerName: { type: String, trim: true },
    mobileNumber: { type: String, trim: true },
    phone: String,
    email: { type: String, lowercase: true, trim: true },
    GSTNumber: { type: String, uppercase: true, trim: true },
    address: String,
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    pincode: { type: String, trim: true },
    currency: { type: String, trim: true, uppercase: true, default: "INR" },
    timezone: { type: String, trim: true, default: "Asia/Kolkata" },
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },
    subscriptionPlanName: { type: String, trim: true, default: "Free Trial" },
    currentSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantSubscription",
    },
    trialStartDate: Date,
    trialEndDate: Date,
    status: {
      type: String,
      enum: ["trialing", "active", "inactive", "suspended", "expired"],
      default: "trialing",
      index: true,
    },
    setupStatus: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
      index: true,
    },
    onboardingSteps: { type: onboardingStepSchema, default: () => ({}) },
    customDomain: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    subdomain: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
    },
    domainStatus: {
      type: String,
      enum: ["not_configured", "pending", "verified", "failed"],
      default: "not_configured",
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

restaurantSchema.index({ email: 1 });

restaurantSchema.pre("validate", function syncLegacyFields(next) {
  if (this.restaurantName && !this.name) this.name = this.restaurantName;
  if (this.name && !this.restaurantName) this.restaurantName = this.name;
  if (this.mobileNumber && !this.phone) this.phone = this.mobileNumber;
  if (this.phone && !this.mobileNumber) this.mobileNumber = this.phone;
  if (this.slug && !this.subdomain) this.subdomain = this.slug;
  next();
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
