// ============================================================
//  routes/authRoutes.js  —  Mounted at /api/auth
// ============================================================
const express = require("express");
const router  = express.Router();

const {
  signup,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// Public
router.post("/signup",              signup);
router.post("/login",               login);
router.get ("/verify-email/:token", verifyEmail);
router.post("/forgot-password",     forgotPassword);
router.put ("/reset-password/:token", resetPassword);

// Private
router.get ("/me",              protect, getMe);
router.put ("/profile",         protect, updateProfile);
router.put ("/change-password", protect, changePassword);

module.exports = router;
