// routes/cartRoutes.js — Mounted at /api/cart
const express = require("express");
const router  = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

// All cart routes require login
router.use(protect);

router.get   ("/",                  getCart);
router.post  ("/add",               addToCart);
router.put   ("/update",            updateCartItem);
router.delete("/remove/:productId", removeFromCart);
router.delete("/clear",             clearCart);

module.exports = router;
