// ============================================================
//  utils/otpUtils.js — OTP generation, hashing, and verification
//  Uses SHA-256 (crypto built-in) — fast and sufficient for
//  short-lived 6-digit OTPs with expiry enforcement.
// ============================================================

const crypto = require("crypto");

/**
 * Generate a cryptographically random 6-digit numeric OTP.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 * @returns {string} 6-digit OTP string (e.g. "048291")
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash an OTP using SHA-256.
 * @param {string} otp — plain text OTP
 * @returns {string} hex-encoded hash
 */
const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Verify a plain OTP against a stored hash.
 * @param {string} plainOtp — user-entered OTP
 * @param {string} hashedOtp — stored hash from DB
 * @returns {boolean}
 */
const verifyOTP = (plainOtp, hashedOtp) => {
  const hash = hashOTP(plainOtp);
  return hash === hashedOtp;
};

module.exports = { generateOTP, hashOTP, verifyOTP };
