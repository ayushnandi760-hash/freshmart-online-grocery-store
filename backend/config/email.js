// ============================================
// Nodemailer Email Configuration
// ============================================
// Configures the SMTP transporter using Gmail.
// Used by the order controller to send:
//   - Order confirmation emails to customers
//   - New order notifications to the admin
// ============================================

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD   // Must be a Gmail App Password
  }
});

// Verify SMTP connection on startup (non-blocking)
transporter.verify()
  .then(() => console.log('✅ Email service connected — SMTP ready'))
  .catch((err) => console.warn('⚠️  Email service unavailable:', err.message,
    '\n   Orders will still work, but emails won\'t be sent.',
    '\n   Check your SMTP_EMAIL and SMTP_PASSWORD in .env'));

module.exports = transporter;
