const mongoose = require("mongoose");
const tenantScopePlugin = require("../../../plugins/tenantScope.plugin");

const designationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    designationName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

designationSchema.index(
  { restaurantId: 1, designationName: 1, isDeleted: 1 },
  { unique: true },
);
designationSchema.plugin(tenantScopePlugin);

module.exports = mongoose.model("Designation", designationSchema);
