// ============================================================
//  routes/addressRoutes.js  —  Address management routes
//  All routes are protected (require JWT authentication)
// ============================================================

const express = require("express");
const router = express.Router();

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// GET all addresses
router.get("/", getAddresses);

// POST new address
router.post("/", addAddress);

// PUT update address
router.put("/:addressId", updateAddress);

// DELETE address
router.delete("/:addressId", deleteAddress);

// PUT set as default
router.put("/:addressId/default", setDefaultAddress);

module.exports = router;
