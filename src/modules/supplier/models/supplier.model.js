const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
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
    supplierName: { type: String, required: true, trim: true },
    image: String,
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    gstNumber: { type: String, default: "" },
    address: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },

  { timestamps: true },
);

supplierSchema.index({
  restaurantId: 1,
  branchId: 1,
  supplierName: 1,
  isDeleted: 1,
});

module.exports = mongoose.model("Supplier", supplierSchema);
