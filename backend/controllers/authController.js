// ============================================================
//  controllers/authController.js  —  UPDATED for multi-vendor
//  Change: signup now accepts `role` and auto-creates Seller doc
// ============================================================

const crypto = require("crypto");
const User   = require("../models/User");
const Seller = require("../models/Seller");
const sendEmail = require("../utils/sendEmail");

// Helper: build JWT response object
const sendTokenResponse = (user, statusCode, res) => {
  const token   = user.generateJWT();
  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({ success: true, token, user: userObj });
};

// ============================================================
//  @desc    Register new user (customer | seller | admin)
//  @route   POST /api/auth/signup
//  @access  Public
// ============================================================
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role = "customer", storeName, storeDescription } = req.body;

    // 1. Validate role — only customer and seller allowed via public signup
    //    Admin accounts must be created manually in the database
    if (role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be created via public signup.",
      });
    }

    // 2. If registering as seller, storeName is required
    if (role === "seller" && !storeName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Store name is required for seller registration.",
      });
    }

    // 3. Check for existing email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    // 4. Create the User document
    const user = await User.create({ name, email, password, role });

    // 5. If seller: create a Seller profile (starts as unapproved)
    if (role === "seller") {
      await Seller.create({
        user:             user._id,
        storeName:        storeName.trim(),
        storeDescription: storeDescription?.trim() || "",
        isApproved:       false, // Admin must approve before seller can list products
      });
    }

    // 6. Generate email verification token and send verification email
    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const verifyUrl = `http://localhost:5000/api/auth/verify-email/${token}`;
    const subject = "Verify Your Email";
    const html = `<h2>Email Verification</h2><a href="${verifyUrl}">Verify Email</a>`;
    await sendEmail(user.email, subject, html);

    res.status(201).json({
      success: true,
      message: "Signup successful, please verify email",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Verify email address via link sent in email
//  @route   GET /api/auth/verify-email/:token
//  @access  Public
// ============================================================
exports.verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Login user
//  @route   POST /api/auth/login
//  @access  Public
// ============================================================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    // Explicitly select password (it's select:false in schema)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email",
      });
    }

    // For sellers: attach their approval status to the response
    // The frontend uses this to show pending/approved state
    let sellerProfile = null;
    if (user.role === "seller") {
      sellerProfile = await Seller.findOne({ user: user._id });
    }

    const token   = user.generateJWT();
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      success: true,
      token,
      user: userObj,
      sellerProfile: sellerProfile || null,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Send forgot password reset email
//  @route   POST /api/auth/forgot-password
//  @access  Public
// ============================================================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `http://localhost:5000/api/auth/reset-password/${token}`;
    const subject = "Reset Your Password";
    const html = `<h2>Password Reset</h2><a href="${resetUrl}">Reset Password</a>`;
    await sendEmail(user.email, subject, html);

    res.status(200).json({ success: true, message: "Reset link sent to email" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Reset password using valid reset token
//  @route   PUT /api/auth/reset-password/:token
//  @access  Public
// ============================================================
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword, password } = req.body;
    const nextPassword = newPassword || password;

    if (!nextPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = nextPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Get currently logged-in user's profile + seller info
//  @route   GET /api/auth/me
//  @access  Private
// ============================================================
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    let sellerProfile = null;
    if (user.role === "seller") {
      sellerProfile = await Seller.findOne({ user: user._id });
    }

    res.status(200).json({ success: true, user, sellerProfile });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Update user profile
//  @route   PUT /api/auth/profile
//  @access  Private
// ============================================================
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  @desc    Change password
//  @route   PUT /api/auth/change-password
//  @access  Private
// ============================================================
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
