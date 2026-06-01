const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    categoryName: { type: String, required: true, trim: true },
    image: String,
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    description: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

categorySchema.index({ restaurantId: 1, branchId: 1, categoryName: 1, isDeleted: 1 });

module.exports = mongoose.model("Category", categorySchema);
