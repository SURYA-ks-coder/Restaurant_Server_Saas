const mongoose = require("mongoose");

const printerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    purpose: {
      type: String,
      enum: ["kot", "bill", "qr_order"],
      required: true,
    },
    kitchenSections: [{ type: String, trim: true }],
    connectionType: {
      type: String,
      enum: ["lan", "browser"],
      required: true,
      default: "browser",
    },
    ip: { type: String, trim: true },
    port: { type: Number, default: 9100 },
    paperWidth: {
      type: String,
      enum: ["58mm", "80mm"],
      default: "80mm",
    },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true },
);

const printerSettingsSchema = new mongoose.Schema(
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
    printers: [printerSchema],
    receipt: {
      showLogo: { type: Boolean, default: true },
      logoUrl: String,
      headerText: { type: String, trim: true },
      footerText: { type: String, trim: true, default: "Thank you! Visit again." },
      showGSTNumber: { type: Boolean, default: true },
      gstNumber: { type: String, trim: true },
      currencySymbol: { type: String, trim: true, default: "₹" },
    },
    kot: {
      headerText: { type: String, trim: true, default: "KITCHEN ORDER TICKET" },
      footerText: { type: String, trim: true },
      showTableName: { type: Boolean, default: true },
    },
    qrOrderSlip: {
      headerText: { type: String, trim: true, default: "ORDER CONFIRMATION" },
      footerText: { type: String, trim: true, default: "Your order has been placed!" },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

printerSettingsSchema.index({ restaurantId: 1, branchId: 1 }, { unique: true });

module.exports = mongoose.model("PrinterSettings", printerSettingsSchema);
