// routes/orderRoutes.js — Mounted at /api/orders
const express = require("express");
const router  = express.Router();
const { placeOrder, getMyOrders, getOrderById, updateOrderStatus, getAllOrders } = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/",             protect,             placeOrder);
router.get ("/my-orders",    protect,             getMyOrders);
router.get ("/admin/all",    protect, adminOnly,  getAllOrders);
router.get ("/:id",          protect,             getOrderById);
router.put ("/:id/status",   protect, adminOnly,  updateOrderStatus);

module.exports = router;
