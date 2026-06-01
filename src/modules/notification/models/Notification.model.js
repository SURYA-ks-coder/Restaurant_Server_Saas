const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    payload: { type: Object, default: {} },
    readAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
