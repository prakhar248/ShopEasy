// ============================================================
//  models/Cart.js  —  One cart per user (upserted on add)
// ============================================================

const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      "Product",
    required: true,
  },
  quantity: {
    type:    Number,
    required: true,
    min:     1,
    default: 1,
  },
  // Snapshot price at the time of adding (price can change later)
  priceAtAdd: {
    type:     Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true, // Each user has exactly one cart
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    // Virtual field: total price — computed, not stored in DB
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: calculate cart total on the fly
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce((acc, item) => acc + item.priceAtAdd * item.quantity, 0);
});

// Virtual: count total items
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

module.exports = mongoose.model("Cart", cartSchema);
