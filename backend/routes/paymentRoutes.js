// routes/paymentRoutes.js — Mounted at /api/payment
const express = require("express");
const router  = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  generatePayUPayment,
  handlePayUSuccess,
  handlePayUFailure,
  retryPayment,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Razorpay routes (protected — user must be logged in)
router.post("/create-order", protect, createRazorpayOrder);
router.post("/verify",       protect, verifyPayment);

// PayU routes
router.post("/payu-generate", protect, generatePayUPayment);
// PayU callbacks (public — called by PayU via browser redirect, no auth token)
// Support BOTH GET and POST — PayU may redirect with either method
router.post("/payu-success", handlePayUSuccess);
router.get("/payu-success",  handlePayUSuccess);
router.post("/payu-failure", handlePayUFailure);
router.get("/payu-failure",  handlePayUFailure);

// Retry payment (protected)
router.post("/retry", protect, retryPayment);

module.exports = router;
