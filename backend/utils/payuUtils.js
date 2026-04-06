// ============================================================
//  utils/payuUtils.js  —  PayU Payment Gateway Utilities
//  Generates hash and payment details for PayU integration
//
//  CRITICAL NOTES:
//  - PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
//  - Reverse hash (verification): salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
//  - Amount MUST be string with exactly 2 decimal places
//  - Phone is MANDATORY (10 digits for Indian numbers)
//  - service_provider must be "payu_paisa" for test mode
// ============================================================

const crypto = require("crypto");

/**
 * Generate unique transaction ID (txnid)
 * PayU requires: 6-40 alphanumeric characters, no special chars
 * Format: TXN + timestamp suffix + random hex
 * @returns {string} Unique transaction ID
 */
const generateTxnId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
  return `TXN${timestamp}${random}`;
};

/**
 * Sanitize productinfo — remove pipe characters that break hash
 * PayU uses pipes as delimiters, so productinfo must not contain them
 * @param {string} str - Raw product info string
 * @returns {string} Sanitized string
 */
const sanitizeProductInfo = (str) => {
  return String(str || "Order").replace(/\|/g, "-").trim();
};

/**
 * Generate SHA-512 hash for PayU payment
 *
 * Hash String Format (forward hash for payment initiation):
 * key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
 *
 * CRITICAL: Amount MUST be string with exactly 2 decimal places (e.g., "500.00")
 * This MUST match the amount sent to PayU, or hash verification will fail
 *
 * @param {Object} params - Payment parameters
 * @param {string} params.key - PayU Merchant Key
 * @param {string} params.salt - PayU Merchant Salt
 * @param {string} params.txnid - Transaction ID
 * @param {string|number} params.amount - Amount (will be formatted to 2 decimals)
 * @param {string} params.productinfo - Product description (will be sanitized)
 * @param {string} params.firstname - Customer first name
 * @param {string} params.email - Customer email
 * @param {string} [params.udf1] - User Defined Field 1 (order ID)
 * @param {string} [params.udf2] - User Defined Field 2 (user ID)
 * @param {string} [params.udf3] - User Defined Field 3
 * @param {string} [params.udf4] - User Defined Field 4
 * @param {string} [params.udf5] - User Defined Field 5
 * @returns {object} { hash: string, formattedAmount: string }
 */
const generatePayUHash = ({
  key,
  salt,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = "",
  udf2 = "",
  udf3 = "",
  udf4 = "",
  udf5 = "",
}) => {
  // FORMAT AMOUNT: Ensure it's a string with exactly 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);

  // Sanitize productinfo — no pipes allowed
  const safeProductInfo = sanitizeProductInfo(productinfo);

  // Build hash string with PayU's exact format:
  // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  const hashString = `${key}|${txnid}|${formattedAmount}|${safeProductInfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;

  // Generate SHA-512 hash
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  console.log("🔐 PayU Hash Generated");
  console.log("   Txn ID:", txnid);
  console.log("   Amount (formatted):", formattedAmount);
  console.log("   Product Info:", safeProductInfo);
  console.log("   Email:", email);
  console.log("   UDF1 (orderId):", udf1);
  console.log("   UDF2 (userId):", udf2);
  console.log("   Hash String:", hashString);
  console.log("   Hash:", hash);

  return { hash, formattedAmount, safeProductInfo };
};

/**
 * Create PayU payment object with ALL required fields
 *
 * @param {Object} params - Payment parameters
 * @param {Object} params.order - MongoDB Order document (populated with user)
 * @param {number} params.amount - Payment amount in rupees
 * @param {string} params.successUrl - Success callback URL
 * @param {string} params.failureUrl - Failure callback URL
 * @returns {Object} PayU payment object ready for form submission
 */
const createPayUPaymentObject = ({
  order,
  amount,
  successUrl,
  failureUrl,
}) => {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;

  if (!key || !salt) {
    throw new Error("PAYU_KEY and PAYU_SALT must be set in environment variables");
  }

  // Generate transaction ID
  const txnid = generateTxnId();

  // Extract customer details with sensible defaults
  const firstname = (order.user?.name?.split(" ")[0] || "Customer").trim();
  const lastname = (order.user?.name?.split(" ").slice(1).join(" ") || "").trim();
  const email = order.user?.email || "noreply@shopnow.com";

  // Phone is MANDATORY for PayU — must be 10 digits for India
  const rawPhone = order.shippingAddress?.phone || order.user?.phone || "";
  const phone = rawPhone.replace(/\D/g, "").slice(-10); // Extract last 10 digits

  if (!phone || phone.length < 10) {
    console.warn("⚠️ PayU: Phone number is missing or invalid:", rawPhone);
    // Use a placeholder for test mode — in production, this should throw
  }

  // Product info (sanitized, no pipes)
  const productinfo = sanitizeProductInfo(
    `Order ${order._id.toString().slice(-6)} - ${order.items?.length || 0} items`
  );

  // UDF fields for tracking
  const udf1 = order._id.toString();      // Order ID
  const udf2 = order.user?._id?.toString() || ""; // User ID

  // Generate hash — returns hash, formatted amount, and safe productinfo
  const { hash, formattedAmount, safeProductInfo } = generatePayUHash({
    key,
    salt,
    txnid,
    amount: amount.toString(),
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
  });

  // Complete PayU payment object
  // IMPORTANT: Use formattedAmount and safeProductInfo (must match hash inputs)
  const paymentObject = {
    key,
    txnid,
    amount: formattedAmount,            // String with 2 decimal places (e.g., "500.00")
    productinfo: safeProductInfo,       // Sanitized product info (no pipes)
    firstname,
    email,
    hash,
    // Callback URLs (PayU will redirect browser to these after payment)
    surl: successUrl,
    furl: failureUrl,
    // MANDATORY for PayU test mode
    service_provider: "payu_paisa",
    // Additional required fields
    lastname: lastname || " ",          // PayU needs non-empty lastname
    phone: phone || "9999999999",       // Fallback for test mode
    address1: order.shippingAddress?.street || "",
    city: order.shippingAddress?.city || "",
    state: order.shippingAddress?.state || "",
    zipcode: order.shippingAddress?.pincode || "",
    country: "India",
    // Custom fields for tracking
    udf1,                               // Order ID
    udf2,                               // User ID
    udf3: "",
    udf4: "",
    udf5: "",
  };

  console.log("📦 PayU Payment Object Created:");
  console.log("   Key:", key);
  console.log("   Txn ID:", txnid);
  console.log("   Amount:", formattedAmount);
  console.log("   Phone:", phone || "9999999999");
  console.log("   Service Provider:", paymentObject.service_provider);

  return paymentObject;
};

/**
 * Verify PayU payment hash from callback (reverse hash)
 *
 * PayU sends a hash in its callback that we must verify.
 * The reverse hash format is:
 * salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 *
 * @param {Object} callbackBody - The full req.body from PayU callback
 * @returns {boolean} Whether hash is valid
 */
const verifyPayUHash = (callbackBody) => {
  const salt = process.env.PAYU_SALT;
  const key = process.env.PAYU_KEY;

  const {
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    hash: receivedHash,
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
    additionalCharges = "",
  } = callbackBody;

  if (!receivedHash || !txnid || !status) {
    console.error("❌ PayU verification: missing required fields");
    return false;
  }

  // Build reverse hash string
  // Format: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  let hashString;
  
  if (additionalCharges) {
    // If PayU adds additional charges, they go at the beginning
    hashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

  console.log("🔍 PayU Reverse Hash Verification");
  console.log("   Txn ID:", txnid);
  console.log("   Status:", status);
  console.log("   Amount:", amount);
  console.log("   Hash String:", hashString);
  console.log("   Expected Hash:", expectedHash);
  console.log("   Received Hash:", receivedHash);
  console.log("   Match:", expectedHash === receivedHash);

  return expectedHash === receivedHash;
};

module.exports = {
  generateTxnId,
  generatePayUHash,
  sanitizeProductInfo,
  createPayUPaymentObject,
  verifyPayUHash,
};
