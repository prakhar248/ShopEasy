// ============================================================
//  routes/sellerRoutes.js  —  Mounted at /api/seller
//  ALL routes here require: protect + sellerOnly middleware
//  sellerOnly also checks isApproved: true
// ============================================================
const express = require("express");
const router  = express.Router();

const {
  getSellerStats,
  getSellerProfile,
  updateSellerProfile,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyOrders,
} = require("../controllers/sellerController");

const { protect, sellerOnly } = require("../middleware/authMiddleware");
const { upload }              = require("../config/cloudinary");

// All routes in this file require a logged-in, approved seller
router.use(protect, sellerOnly);

// ── Dashboard ─────────────────────────────────────────────
router.get("/stats",   getSellerStats);

// ── Seller Profile ────────────────────────────────────────
router.get("/profile", getSellerProfile);
router.put("/profile", updateSellerProfile);

// ── Product Management ────────────────────────────────────
// GET    /api/seller/products       → list own products
// POST   /api/seller/products       → create product (with image upload)
// PUT    /api/seller/products/:id   → update own product
// DELETE /api/seller/products/:id   → delete own product
router.get   ("/products",     getMyProducts);
router.post  ("/products",     upload.array("images", 5), createProduct);
router.put   ("/products/:id", upload.array("images", 5), updateProduct);
router.delete("/products/:id", deleteProduct);

// ── Orders ────────────────────────────────────────────────
router.get("/orders", getMyOrders);

module.exports = router;
