// ============================================================
//  middleware/authMiddleware.js  —  UPDATED for multi-vendor
//
//  Exports 4 middleware functions:
//  1. protect      → verifies JWT, attaches req.user
//  2. adminOnly    → allows only role: "admin"
//  3. sellerOnly   → allows only role: "seller" (approved)
//  4. sellerOrAdmin → allows either seller or admin
//
//  Usage in routes:
//    router.get("/secret",   protect, adminOnly,     handler)
//    router.post("/product", protect, sellerOnly,    handler)
//    router.put("/product",  protect, sellerOrAdmin, handler)
// ============================================================

const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const Seller = require("../models/Seller");

// ── 1. protect ───────────────────────────────────────────────
// Decodes JWT from Authorization header and attaches user to req
exports.protect = async (req, res, next) => {
  let token;

  // Token format: "Authorization: Bearer <token>"
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized — no token provided" });
  }

  try {
    // Decode and verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the full user document to req (used in all subsequent handlers)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Not authorized — token invalid or expired" });
  }
};

// ── 2. adminOnly ─────────────────────────────────────────────
// Must come AFTER protect (needs req.user)
exports.adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Access denied — admin only" });
};

// ── 3. sellerOnly ────────────────────────────────────────────
// Allows only approved sellers to proceed.
// Checks the Seller document for isApproved: true.
exports.sellerOnly = async (req, res, next) => {
  if (req.user?.role !== "seller") {
    return res.status(403).json({ success: false, message: "Access denied — sellers only" });
  }

  // Check if this seller has been approved by admin
  const sellerProfile = await Seller.findOne({ user: req.user._id });

  if (!sellerProfile) {
    return res.status(403).json({
      success: false,
      message: "Seller profile not found. Please contact support.",
    });
  }

  if (!sellerProfile.isApproved) {
    return res.status(403).json({
      success: false,
      message: "Your seller account is pending admin approval. You will be notified once approved.",
    });
  }

  // Attach seller profile to req for use in controllers
  req.sellerProfile = sellerProfile;
  next();
};

// ── 4. sellerOrAdmin ─────────────────────────────────────────
// Allows either an approved seller OR an admin to proceed.
// Used for routes where both roles have access (e.g. product management).
exports.sellerOrAdmin = async (req, res, next) => {
  if (req.user?.role === "admin") return next();

  if (req.user?.role === "seller") {
    const sellerProfile = await Seller.findOne({ user: req.user._id });
    if (!sellerProfile?.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your seller account is pending approval.",
      });
    }
    req.sellerProfile = sellerProfile;
    return next();
  }

  return res.status(403).json({ success: false, message: "Access denied — sellers and admins only" });
};
