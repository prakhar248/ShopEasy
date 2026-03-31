// ============================================================
//  controllers/paymentController.js
//  Razorpay integration (test mode)
//
//  FLOW:
//  1. Frontend hits /api/payment/create-order → gets Razorpay order_id
//  2. Frontend opens Razorpay checkout using order_id
//  3. User pays → Razorpay sends payment_id, order_id, signature back
//  4. Frontend hits /api/payment/verify → we verify signature, mark order paid
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
//  @desc    Create a Razorpay order for a placed order
//  @route   POST /api/payment/create-order
//  @access  Private
// ============================================================
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Fetch our order from MongoDB
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Create a Razorpay order
    // Amount must be in paise (₹1 = 100 paise)
    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.totalPrice * 100), // Convert ₹ to paise
      currency: "INR",
      receipt:  `receipt_${orderId}`,
      notes: {
        orderId:  orderId.toString(),
        userId:   req.user.id.toString(),
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
      // Send key_id to frontend (never send key_secret!)
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
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
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 3. Mark the order as paid
    const order = await Order.findById(orderId);
    order.paymentStatus      = "paid";
    order.razorpayPaymentId  = razorpay_payment_id;
    order.razorpaySignature  = razorpay_signature;
    order.paidAt             = Date.now();
    await order.save();

    res.status(200).json({ success: true, message: "Payment verified", order });
  } catch (error) {
    next(error);
  }
};
