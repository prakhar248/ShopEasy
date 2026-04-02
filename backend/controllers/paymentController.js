// ============================================================
//  controllers/paymentController.js
//  Razorpay integration (test mode)
//
//  FLOW:
//  1. Order is created in DB first via /api/orders
//  2. Frontend sends orderId to /api/payment/create-order
//  3. This creates a Razorpay order for that orderId
//  4. Frontend opens Razorpay checkout and user pays
//  5. Frontend sends payment details to /api/payment/verify
//  6. We verify signature and mark order as paid
// ============================================================

const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Order    = require("../models/Order");

// Initialize Razorpay with test keys from .env
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
//  @desc    Create a Razorpay order for an existing order
//  @route   POST /api/payment/create-order
//  @access  Private
// ============================================================
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    // Fetch our order from MongoDB
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to this user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized - Order does not belong to you" });
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Order already paid" });
    }

    // Create a Razorpay order
    // Amount must be in paise (₹1 = 100 paise)
    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.totalPrice * 100), // Convert ₹ to paise
      currency: "INR",
      receipt:  `receipt_${orderId}`,
      notes: {
        orderId:  orderId.toString(),
        userId:   req.user._id.toString(),
      },
    });

    // Save the Razorpay order_id to our order record
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(200).json({
      success:         true,
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      // Send key_id to frontend (NEVER send key_secret!)
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    next(error);
  }
};

// ============================================================
//  @desc    Verify Razorpay payment signature
//  @route   POST /api/payment/verify
//  @access  Private
//
//  How signature verification works:
//  Razorpay creates: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
//  We recreate the same hash and compare — if they match, payment is genuine.
// ============================================================
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields",
      });
    }

    // 1. Re-create the expected signature
    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    // 2. Compare signatures (timing-safe comparison prevents timing attacks)
    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature)
    );

    if (!isAuthentic) {
      console.warn("Payment signature mismatch for order:", orderId);
      return res.status(400).json({ success: false, message: "Payment verification failed - Invalid signature" });
    }

    // 3. Fetch and verify the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to this user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized - Order does not belong to you" });
    }

    // 4. Mark the order as paid
    order.paymentStatus      = "paid";
    order.razorpayPaymentId  = razorpay_payment_id;
    order.razorpaySignature  = razorpay_signature;
    order.paidAt             = new Date();
    await order.save();

    console.log("✅ Payment verified for order:", orderId);

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    next(error);
  }
};
