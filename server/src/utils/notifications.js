const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Initialize Twilio Client
// Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are in .env
let twilioClient;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.error("Twilio initialization error:", error.message);
}

// Initialize Nodemailer transporter
// Ensure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS are in .env
let transporter;
try {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT == 465, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
} catch (error) {
  console.error("Nodemailer initialization error:", error.message);
}

/**
 * Send SMS notification
 * @param {string} to - The recipient's phone number
 * @param {string} message - The message body
 */
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.warn("SMS not sent: Twilio client is not configured.");
    return;
  }
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error.message);
  }
};

/**
 * Send Email notification
 * @param {string} to - The recipient's email address
 * @param {string} subject - The email subject
 * @param {string} text - The email body (plain text)
 */
const sendEmail = async (to, subject, text) => {
  if (!transporter) {
    console.warn("Email not sent: Nodemailer transporter is not configured.");
    return;
  }
  try {
    await transporter.sendMail({
      from: `"GoGirl Market" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send Email to ${to}:`, error.message);
  }
};

/**
 * Convenience function for Order Placed
 */
const sendOrderPlaced = async (user, order) => {
  const smsMsg = `Hi ${user.name}, your GoGirl Market order #${order._id.toString().substring(0,6)} has been placed successfully! We'll notify you when it ships.`;
  const emailSubj = `Order Confirmation - #${order._id}`;
  const emailBody = `Hello ${user.name},\n\nThank you for shopping with GoGirl Market!\nYour order has been received and is currently being processed.\n\nOrder ID: ${order._id}\nTotal: $${order.totalPrice}\n\nWe will notify you once it's confirmed and shipped.`;

  if (order.shippingAddress && order.shippingAddress.phone) {
    await sendSMS(order.shippingAddress.phone, smsMsg);
  }
  if (user.email) {
    await sendEmail(user.email, emailSubj, emailBody);
  }
};

/**
 * Convenience function for Order Status Updates
 */
const sendOrderStatusUpdate = async (user, order, newStatus) => {
  const smsMsg = `Hi ${user.name}, your GoGirl Market order #${order._id.toString().substring(0,6)} status is now: ${newStatus}.`;
  const emailSubj = `Order Update: ${newStatus} - #${order._id}`;
  const emailBody = `Hello ${user.name},\n\nYour order #${order._id} status has been updated to: ${newStatus}.\n\nThank you for shopping with GoGirl Market!`;

  if (order.shippingAddress && order.shippingAddress.phone) {
    await sendSMS(order.shippingAddress.phone, smsMsg);
  }
  if (user.email) {
    await sendEmail(user.email, emailSubj, emailBody);
  }
};

module.exports = {
  sendSMS,
  sendEmail,
  sendOrderPlaced,
  sendOrderStatusUpdate,
};
