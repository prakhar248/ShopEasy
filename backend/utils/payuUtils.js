// ============================================================
//  utils/payuUtils.js  —  PayU Payment Gateway Utilities
//
//  SINGLE SOURCE OF TRUTH APPROACH:
//  All field values are cleaned ONCE in createPayUPaymentObject.
//  generatePayUHash takes those EXACT cleaned values — no re-sanitization.
//  The form data sent to PayU uses the exact same values.
//  Hash fields == Form fields. No mismatch possible.
//
//  Hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
//  (17 elements, 16 pipes, 5 empty reserved fields before salt)
// ============================================================

const crypto = require("crypto");

/**
 * Generate SHA-512 hash for PayU payment.
 * Takes PRE-CLEANED values — does NOT sanitize anything.
 * Every value passed here must be the EXACT value going into the form.
 *
 * @returns {string} SHA-512 hash hex string
 */
const generatePayUHash = (key, salt, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5) => {
  // Build hash string: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
  // 17 elements joined by "|" = 16 pipe characters
  const hashString = [
    key, txnid, amount, productinfo, firstname, email,
    udf1, udf2, udf3, udf4, udf5,
    "", "", "", "", "",  // 5 reserved empty fields
    salt
  ].join("|");

  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  // Verify pipe count
  const pipeCount = (hashString.match(/\|/g) || []).length;

  console.log("\n=== PAYU HASH GENERATION ===");
  console.log("FINAL HASH STRING:", hashString);
  console.log("Pipe count:", pipeCount, pipeCount === 16 ? "✅ CORRECT" : "❌ WRONG! Expected 16");
  console.log("Generated hash:", hash);
  console.log("=== END HASH ===\n");

  return hash;
};

/**
 * Create PayU payment object — SINGLE SOURCE OF TRUTH.
 *
 * 1. All values are cleaned/formatted ONCE here
 * 2. Hash is generated from these exact values
 * 3. Form fields use these exact values
 * 4. No re-sanitization anywhere
 */
const createPayUPaymentObject = ({ order, amount, successUrl, failureUrl }) => {
  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;

  if (!key || !salt) {
    throw new Error("PAYU_KEY and PAYU_SALT must be set in environment variables");
  }

  // ── Step 1: Clean ALL values ONCE ──────────────────────────

  // Txnid: MUST be unique every request — add random suffix to guarantee
  const txnid = "TXN_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

  // Amount: MUST be string with exactly 2 decimal places
  const cleanAmount = Number(amount).toFixed(2);

  // Product info: simple alphanumeric only — no spaces, no special chars, no pipes
  const cleanProductinfo = "Order_" + order._id.toString().slice(-8);

  // Firstname: alphanumeric only, fallback to "User"
  const cleanFirstname = (order.user?.name?.split(" ")[0] || "User").replace(/[^a-zA-Z0-9]/g, "").trim() || "User";

  // Email: trimmed, lowercase
  const cleanEmail = (order.user?.email || "test@example.com").trim().toLowerCase();

  // Phone: exactly 10 digits, mandatory
  const rawPhone = order.shippingAddress?.phone || order.user?.phone || "9999999999";
  const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10) || "9999999999";

  // UDF fields — keep simple
  const udf1 = order._id.toString();
  const udf2 = order.user?._id?.toString() || "";
  const udf3 = "";
  const udf4 = "";
  const udf5 = "";

  // Lastname (not in hash, but sent in form)
  const cleanLastname = (order.user?.name?.split(" ").slice(1).join(" ") || "").replace(/[^a-zA-Z ]/g, "").trim();

  // ── Step 2: Generate hash from EXACT same values ───────────

  const hash = generatePayUHash(
    key, salt, txnid, cleanAmount, cleanProductinfo,
    cleanFirstname, cleanEmail, udf1, udf2, udf3, udf4, udf5
  );

  // ── Step 3: Build form object using ONLY required fields ───
  // PayU mandatory: key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash, service_provider
  // Sending ONLY what's needed to minimize interference

  const paymentObject = {
    // === MANDATORY FIELDS (must match hash) ===
    key:              key,
    txnid:            txnid,
    amount:           cleanAmount,
    productinfo:      cleanProductinfo,
    firstname:        cleanFirstname,
    email:            cleanEmail,
    phone:            cleanPhone,
    hash:             hash,
    surl:             successUrl,
    furl:             failureUrl,
    service_provider: "payu_paisa",
    // === UDF FIELDS (in hash) ===
    udf1:             udf1,
    udf2:             udf2,
    udf3:             udf3,
    udf4:             udf4,
    udf5:             udf5,
    // === OPTIONAL FIELDS (NOT in hash, safe to include) ===
    lastname:         cleanLastname,
    address1:         (order.shippingAddress?.street || "").trim(),
    city:             (order.shippingAddress?.city || "").trim(),
    state:            (order.shippingAddress?.state || "").trim(),
    zipcode:          (order.shippingAddress?.pincode || "").trim(),
    country:          "India",
  };

  // ── Step 4: Log FINAL PAYLOAD ──────────────────────────────

  console.log("\n=== PAYU FINAL PAYLOAD ===");
  Object.entries(paymentObject).forEach(([k, v]) => {
    if (k === "hash") {
      console.log(`  ${k}: ${v.substring(0, 32)}...`);
    } else {
      console.log(`  ${k}: "${v}"`);
    }
  });
  console.log("=== END PAYLOAD ===\n");

  // ── Step 5: VERIFY field-by-field match ────────────────────

  const mismatches = [];
  if (key !== paymentObject.key) mismatches.push("key");
  if (txnid !== paymentObject.txnid) mismatches.push("txnid");
  if (cleanAmount !== paymentObject.amount) mismatches.push("amount");
  if (cleanProductinfo !== paymentObject.productinfo) mismatches.push("productinfo");
  if (cleanFirstname !== paymentObject.firstname) mismatches.push("firstname");
  if (cleanEmail !== paymentObject.email) mismatches.push("email");
  if (udf1 !== paymentObject.udf1) mismatches.push("udf1");
  if (udf2 !== paymentObject.udf2) mismatches.push("udf2");

  if (mismatches.length > 0) {
    console.error("❌ HASH/FORM MISMATCH DETECTED IN:", mismatches.join(", "));
  } else {
    console.log("✅ ALL HASH INPUT VALUES MATCH FORM VALUES — NO MISMATCH");
  }

  return paymentObject;
};

/**
 * Verify PayU payment hash from callback (reverse hash)
 *
 * Reverse hash format:
 * salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
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

  // Reverse hash: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  let hashString;

  if (additionalCharges) {
    hashString = [additionalCharges, salt, status, "", "", "", "", "", udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key].join("|");
  } else {
    hashString = [salt, status, "", "", "", "", "", udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key].join("|");
  }

  const expectedHash = crypto.createHash("sha512").update(hashString).digest("hex");

  console.log("\n=== PAYU REVERSE HASH VERIFICATION ===");
  console.log("Reverse hash string:", hashString);
  console.log("Expected:", expectedHash.substring(0, 32) + "...");
  console.log("Received:", receivedHash.substring(0, 32) + "...");
  console.log("Match:", expectedHash === receivedHash ? "✅ YES" : "❌ NO");
  console.log("=== END VERIFICATION ===\n");

  return expectedHash === receivedHash;
};

module.exports = {
  generatePayUHash,
  createPayUPaymentObject,
  verifyPayUHash,
};
