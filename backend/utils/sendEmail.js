// ============================================================
//  utils/sendEmail.js — Resend email utility
//  Replaces Nodemailer. Uses Resend SDK for transactional emails.
// ============================================================

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend.
 * @param {Object} options
 * @param {string} options.to      — recipient email
 * @param {string} options.subject — email subject line
 * @param {string} options.html    — HTML body content
 * @returns {Promise<Object>}      — Resend API response
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "ShopperStop <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend email error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("✅ Email sent via Resend:", data?.id);
    return data;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    throw err;
  }
};

module.exports = sendEmail;