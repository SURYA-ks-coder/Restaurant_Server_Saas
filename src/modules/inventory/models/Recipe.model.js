const mongoose = require("mongoose");

const recipeIngredientSchema = new mongoose.Schema(
  {
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    quantity: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true, index: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true, index: true },
    ingredients: [recipeIngredientSchema],
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);
