const mongoose = require("mongoose");
const tenantScopePlugin = require("../../../plugins/tenantScope.plugin");

const shiftSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    shiftName: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
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

shiftSchema.index(
  { restaurantId: 1, shiftName: 1, isDeleted: 1 },
  { unique: true },
);
shiftSchema.plugin(tenantScopePlugin);

module.exports = mongoose.model("Shift", shiftSchema);
