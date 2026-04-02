const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send password reset OTP email
 */
const sendResetOTP = async (toEmail, otp, userName) => {
  const mailOptions = {
    from: `"BidAmharic Auction" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Password Reset Code - BidAmharic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 24px; margin: 0;">🔐 Password Reset</h1>
          <p style="color: #6b7280; margin-top: 8px;">BidAmharic Auction Platform</p>
        </div>

        <p style="color: #374151;">Hello ${userName || 'there'},</p>
        <p style="color: #374151;">You requested a password reset. Use the code below:</p>

        <div style="background: #fef9c3; border: 2px solid #facc15; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <p style="color: #92400e; font-size: 13px; margin: 0 0 8px 0; font-weight: bold;">YOUR RESET CODE</p>
          <p style="color: #78350f; font-size: 36px; font-weight: bold; letter-spacing: 0.4em; margin: 0;">${otp}</p>
          <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Expires in 15 minutes</p>
        </div>

        <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email. Your password will not change.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">BidAmharic — Haramaya University Final Project</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Reset OTP email sent to ${toEmail}`);
};

module.exports = { sendResetOTP };
