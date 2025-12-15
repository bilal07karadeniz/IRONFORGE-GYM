const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} bytes - Number of bytes for the token
 * @returns {string} - Hex-encoded token
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate email verification token and expiry
 * @param {number} expiryHours - Hours until token expires
 * @returns {Object} - Token and expiry date
 */
const generateEmailVerificationToken = (expiryHours = 24) => {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + expiryHours);

  return {
    token,
    expires,
  };
};

/**
 * Generate password reset token and expiry
 * @param {number} expiryMinutes - Minutes until token expires
 * @returns {Object} - Token and expiry date
 */
const generatePasswordResetToken = (expiryMinutes = 60) => {
  const token = generateToken();
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiryMinutes);

  return {
    token,
    expires,
  };
};

/**
 * Prepare email verification data
 * In production, this would send an actual email
 * @param {Object} user - User object
 * @param {string} token - Verification token
 * @returns {Object} - Email data for logging/testing
 */
const prepareVerificationEmail = (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  // In production, you would integrate with an email service like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP

  return {
    to: user.email,
    subject: 'Verify Your Email - Gym Appointment System',
    html: `
      <h1>Welcome to Gym Appointment System!</h1>
      <p>Hi ${user.full_name},</p>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
        Verify Email
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
    text: `
      Welcome to Gym Appointment System!

      Hi ${user.full_name},

      Thank you for registering. Please verify your email address by visiting:
      ${verificationUrl}

      This link will expire in 24 hours.

      If you didn't create an account, please ignore this email.
    `,
  };
};

/**
 * Prepare password reset email data
 * @param {Object} user - User object
 * @param {string} token - Reset token
 * @returns {Object} - Email data
 */
const preparePasswordResetEmail = (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  return {
    to: user.email,
    subject: 'Password Reset Request - Gym Appointment System',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.full_name},</p>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px;">
        Reset Password
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
    `,
    text: `
      Password Reset Request

      Hi ${user.full_name},

      You requested to reset your password. Visit the link below to set a new password:
      ${resetUrl}

      This link will expire in 1 hour.

      If you didn't request a password reset, please ignore this email.
    `,
  };
};

/**
 * Log email (for development/testing)
 * In production, replace with actual email sending
 * @param {Object} emailData - Email data object
 */
const sendEmail = async (emailData) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n========== EMAIL ==========');
    console.log('To:', emailData.to);
    console.log('Subject:', emailData.subject);
    console.log('Text:', emailData.text);
    console.log('===========================\n');
  }

  // In production, implement actual email sending here
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(emailData);

  return { success: true, messageId: `dev-${Date.now()}` };
};

module.exports = {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  prepareVerificationEmail,
  preparePasswordResetEmail,
  sendEmail,
};
