const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../../../config/env");
const tenantScopePlugin = require("../../../plugins/tenantScope.plugin");

const userSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    branchIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Branch", index: true },
    ],
    defaultBranchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: {
      type: String,
      required: false,
      select: false,
      default: "res123RE",
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "owner",
        "manager",
        "cashier",
        "chef",
        "waiter",
        "inventory_staff",
      ],
      default: "owner",
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    permissions: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    refreshTokenHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordChangedAt: Date,
    lastLoginAt: Date,
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

userSchema.index({ restaurantId: 1, email: 1 }, { unique: true });
userSchema.plugin(tenantScopePlugin);

userSchema.pre("save", async function hashPassword(next) {
  if (this.name && !this.ownerName && this.role === "owner")
    this.ownerName = this.name;
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);
  this.passwordChangedAt = new Date();
  return next();
});

userSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
