const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.warn('sendEmail skipped: No recipient email address provided.');
    return;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn(`[Mock Email] To: ${to} | Subject: ${subject} (SMTP_USER or SMTP_PASS not set)`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"GoGirl Market" <${user}>`,
      to,
      subject,
      html,
    };

    console.log(`[Email] Sending email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message successfully sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
  }
};

module.exports = sendEmail;
