// ============================================================
//  routes/productRoutes.js  —  Mounted at /api/products
//  Public browsing + authenticated review submission
//  Product CRUD is handled by /api/seller/* routes
// ============================================================
const express = require("express");
const router  = express.Router();

const {
  getProducts,
  getProductById,
  addReview,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

// Public
router.get("/",    getProducts);
router.get("/:id", getProductById);

// Private (logged-in users — customers only, controller enforces this)
router.post("/:id/reviews", protect, addReview);

module.exports = router;
