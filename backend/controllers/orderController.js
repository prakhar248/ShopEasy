// ============================================================
//  controllers/orderController.js  —  UPDATED: snapshot seller on items
// ============================================================
const Order   = require("../models/Order");
const Cart    = require("../models/Cart");
const Product = require("../models/Product");

exports.placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // Snapshot product details + seller on each item
    const orderItems = cart.items.map((item) => ({
      product:  item.product._id,
      seller:   item.product.seller,   // <-- seller is now stored per item
      name:     item.product.name,
      image:    item.product.images[0]?.url || "",
      price:    item.priceAtAdd,
      quantity: item.quantity,
    }));

    const itemsPrice    = cart.items.reduce((acc, i) => acc + i.priceAtAdd * i.quantity, 0);
    const shippingPrice = itemsPrice > 500 ? 0 : 50;
    const taxPrice      = Math.round(itemsPrice * 0.18);
    const totalPrice    = itemsPrice + shippingPrice + taxPrice;

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus: "pending",
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort("-createdAt")
      .populate("items.product", "name images");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    const isOwner = order.user._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email");
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};