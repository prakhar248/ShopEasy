// ============================================================
//  utils/sendEmail.js — Brevo Email with Fallback
//  SMTP-first strategy with Brevo API fallback for reliability
//  Handles deployed environment issues (ETIMEDOUT on Render, etc)
// ============================================================

const nodemailer = require("nodemailer");
const axios = require("axios");

const SENDER_EMAIL = "prakharchouhan.dev@gmail.com";
const SENDER_NAME = "ShopEasy";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SMTP_TIMEOUT = 10000; // 10 seconds timeout for SMTP

// ──────────────────────────────────────────────────────────
// SMTP Configuration & Validation
// ──────────────────────────────────────────────────────────

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn("⚠️  SMTP configuration incomplete — will use API fallback");
  console.warn("   SMTP_HOST:", process.env.SMTP_HOST ? "SET" : "NOT SET");
  console.warn("   SMTP_USER:", process.env.SMTP_USER ? "SET" : "NOT SET");
  console.warn("   SMTP_PASS:", process.env.SMTP_PASS ? "SET" : "NOT SET");
}

if (!process.env.BREVO_API_KEY) {
  console.warn("⚠️  BREVO_API_KEY not set — API fallback will fail");
}

// Create Nodemailer transporter with timeout
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465,
    secure: true, // SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: SMTP_TIMEOUT,
    socketTimeout: SMTP_TIMEOUT,
    logger: false,
    debug: false
  });

  // Verify SMTP connection on startup (non-blocking)
  console.log("🔍 Testing SMTP connection...");
  transporter.verify()
    .then(() => {
      console.log("✅ Brevo SMTP connection successful!");
    })
    .catch((error) => {
      console.warn("⚠️  SMTP connection test failed — will use API fallback");
      console.warn("   Error:", error.message);
    });
}

// ──────────────────────────────────────────────────────────
// API Fallback Method (Brevo REST API)
// ──────────────────────────────────────────────────────────

/**
 * Send email via Brevo REST API (fallback)
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - HTML content
 * @returns {Promise<Object>} - API response
 */
const sendViaBrevoAPI = async (to, subject, html) => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  try {
    const response = await axios.post(
      BREVO_API_URL,
      {
        sender: {
          name: SENDER_NAME,
          email: SENDER_EMAIL
        },
        to: [{ email: to }],
        subject,
        htmlContent: html
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: SMTP_TIMEOUT
      }
    );

    return {
      messageId: response.data.messageId,
      response: "Email sent via Brevo API",
      via: "API"
    };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    throw new Error(`Brevo API error: ${errorMsg}`);
  }
};

// ──────────────────────────────────────────────────────────
// Main Email Function (SMTP → API Fallback)
// ──────────────────────────────────────────────────────────

/**
 * Send email with automatic fallback from SMTP to Brevo API.
 * FIRST tries SMTP (reliable for local/traditional deploys).
 * ON FAILURE falls back to Brevo REST API (reliable for serverless/Render).
 * 
 * @param {Object} options
 * @param {string} options.to      — recipient email address
 * @param {string} options.subject — email subject line
 * @param {string} options.html    — HTML body content
 * @returns {Promise<Object>}      — { messageId, response, via: "SMTP"|"API" }
 * @throws {Error}                 — if both methods fail
 */
const sendEmail = async ({ to, subject, html }) => {
  // Input validation
  if (!to) throw new Error("Recipient email is required");
  if (!subject) throw new Error("Email subject is required");
  if (!html) throw new Error("Email HTML content is required");

  console.log("\n📧 Attempting to send email...");
  console.log("   To:", to);
  console.log("   Subject:", subject);

  // ─── STRATEGY 1: SMTP (Primary) ──────────────────────────────
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
        to,
        subject,
        html
      });

      console.log("✅ Email sent successfully via SMTP!");
      console.log("   Message ID:", info.messageId);
      return {
        messageId: info.messageId,
        response: info.response,
        via: "SMTP"
      };
    } catch (smtpError) {
      // Log SMTP failure and proceed to fallback
      console.warn("\n⚠️  SMTP failed, switching to API...");
      console.warn("   Error:", smtpError.message);
      console.warn("   Code:", smtpError.code);
    }
  }

  // ─── STRATEGY 2: Brevo API (Fallback) ─────────────────────────
  try {
    console.log("🔄 Sending email via Brevo API...");
    const apiResult = await sendViaBrevoAPI(to, subject, html);
    console.log("✅ Email sent successfully via API!");
    console.log("   Message ID:", apiResult.messageId);
    return apiResult;
  } catch (apiError) {
    console.error("\n❌ Email sending failed (both SMTP and API)!");
    console.error("   SMTP Error: Previous attempt failed");
    console.error("   API Error:", apiError.message);
    throw new Error(
      `Email delivery failed: SMTP unavailable, API error: ${apiError.message}`
    );
  }
};

module.exports = sendEmail;