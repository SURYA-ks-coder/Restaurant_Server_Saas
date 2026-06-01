const mongoose = require("mongoose");
const tenantScopePlugin = require("../../../plugins/tenantScope.plugin");

const branchSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    branchName: { type: String, required: true, trim: true },
    branchCode: { type: String, trim: true, uppercase: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    phone: String,
    address: String,
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

branchSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
branchSchema.index({ restaurantId: 1, branchCode: 1, isDeleted: 1 });
branchSchema.plugin(tenantScopePlugin);

branchSchema.pre("validate", function syncBranchCode(next) {
  if (this.branchCode && !this.code) this.code = this.branchCode;
  if (this.code && !this.branchCode) this.branchCode = this.code;
  next();
});

module.exports = mongoose.model("Branch", branchSchema);
