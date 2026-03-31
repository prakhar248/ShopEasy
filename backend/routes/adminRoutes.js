// ============================================================
//  routes/adminRoutes.js  —  Mounted at /api/admin
//  ALL routes here require: protect + adminOnly
// ============================================================
const express = require("express");
const router  = express.Router();

const {
  getStats,
  getAllUsers,
  getAllSellers,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  deleteUser,
  deleteAnyProduct,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// All routes in this file require admin
router.use(protect, adminOnly);

// ── Dashboard ─────────────────────────────────────────────
router.get("/stats", getStats);

// ── Users ─────────────────────────────────────────────────
router.get   ("/users",      getAllUsers);
router.delete("/users/:id",  deleteUser);

// ── Sellers ───────────────────────────────────────────────
router.get("/sellers",                    getAllSellers);
router.get("/sellers/pending",            getPendingSellers);
router.put("/sellers/:id/approve",        approveSeller);
router.put("/sellers/:id/reject",         rejectSeller);

// ── Products ──────────────────────────────────────────────
router.delete("/products/:id", deleteAnyProduct);

// ── Orders ────────────────────────────────────────────────
router.get("/orders",              getAllOrders);
router.put("/orders/:id/status",   updateOrderStatus);

module.exports = router;
