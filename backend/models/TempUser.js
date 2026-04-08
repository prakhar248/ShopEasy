const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const tempUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true }, // We will store hashed password
    role: { type: String, default: "customer" },
    storeName: { type: String }, // optional for seller
    storeDescription: { type: String }, // optional for seller
    otpHash: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: "1h" }, // TTL index: auto delete after 1 hour if not verified
  }
);

module.exports = mongoose.model("TempUser", tempUserSchema);
