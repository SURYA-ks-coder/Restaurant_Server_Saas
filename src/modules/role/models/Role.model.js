const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    roleName: { type: String, required: true, trim: true },
    permissions: [{ type: String, trim: true }],
    menus: [{ type: Number }],
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

roleSchema.index({ restaurantId: 1, roleName: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
