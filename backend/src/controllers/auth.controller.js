const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const config = require('../config');
const { generateTokenPair, verifyRefreshToken, decodeToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/response');
const { blacklistToken, isTokenBlacklisted, blacklistAllUserTokens } = require('../services/tokenBlacklist.service');
const {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  prepareVerificationEmail,
  preparePasswordResetEmail,
  sendEmail,
} = require('../services/email.service');
const { validatePassword } = require('../utils/passwordValidator');

// Maximum login attempts before temporary lockout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

/**
 * Register a new user with email verification preparation
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, role = 'member' } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw AppError.conflict('User with this email already exists');
    }

    // Additional password validation with email context
    const passwordValidation = validatePassword(password, email);
    if (!passwordValidation.isValid) {
      throw AppError.badRequest(passwordValidation.errors[0]);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

    // Generate email verification token
    const verificationData = generateEmailVerificationToken();

    // Create user with verification token
    const result = await query(
      `INSERT INTO users (email, password, full_name, phone, role, email_verification_token, email_verification_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, phone, role, email_verified, created_at`,
      [email, hashedPassword, full_name, phone, role, verificationData.token, verificationData.expires]
    );

    const user = result.rows[0];

    // Prepare and send verification email (in production, actually send it)
    const emailData = prepareVerificationEmail(user, verificationData.token);
    await sendEmail(emailData);

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [tokens.refreshToken, user.id]
    );

    return created(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
      ...tokens,
      message: 'Please check your email to verify your account',
    }, 'User registered successfully. Verification email sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * Login with JWT tokens
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with lockout info
    const result = await query(
      `SELECT id, email, password, full_name, phone, role, is_active,
              email_verified, login_attempts, locked_until
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw AppError.tooManyRequests(
        `Account temporarily locked. Try again in ${remainingMinutes} minutes`
      );
    }

    // Check if user is active
    if (!user.is_active) {
      throw AppError.unauthorized('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = (user.login_attempts || 0) + 1;
      const updateData = { login_attempts: newAttempts };

      // Lock account if max attempts exceeded
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
        updateData.locked_until = lockUntil;

        await query(
          'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
          [newAttempts, lockUntil, user.id]
        );

        throw AppError.tooManyRequests(
          `Too many failed attempts. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes`
        );
      }

      await query(
        'UPDATE users SET login_attempts = $1 WHERE id = $2',
        [newAttempts, user.id]
      );

      const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
      throw AppError.unauthorized(
        `Invalid email or password. ${remainingAttempts} attempts remaining`
      );
    }

    // Clear login attempts and update last login on successful login
    await query(
      `UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW()
       WHERE id = $1`,
      [user.id]
    );

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Store refresh token
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [tokens.refreshToken, user.id]
    );

    return success(res, {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        email_verified: user.email_verified,
      },
      ...tokens,
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw AppError.unauthorized('Token has been revoked');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // Find user and verify refresh token matches
    const result = await query(
      'SELECT id, email, full_name, role, is_active, refresh_token FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw AppError.unauthorized('User not found');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw AppError.unauthorized('Your account has been deactivated');
    }

    if (user.refresh_token !== token) {
      // Possible token reuse - blacklist and force re-login
      await blacklistAllUserTokens(user.id, 'security');
      throw AppError.unauthorized('Invalid refresh token. Please log in again');
    }

    // Blacklist the old refresh token
    const tokenExpiry = new Date(decoded.exp * 1000);
    await blacklistToken(token, user.id, tokenExpiry, 'refresh');

    // Generate new tokens
    const tokens = generateTokenPair(user);

    // Store new refresh token
    await query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [tokens.refreshToken, user.id]
    );

    return success(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Logout and invalidate refresh token
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Get the current refresh token to blacklist
    const result = await query(
      'SELECT refresh_token FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows[0]?.refresh_token) {
      // Decode token to get expiry
      const decoded = decodeToken(result.rows[0].refresh_token);
      const tokenExpiry = decoded ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Blacklist the refresh token
      await blacklistToken(
        result.rows[0].refresh_token,
        req.user.id,
        tokenExpiry,
        'logout'
      );
    }

    // Clear refresh token from user record
    await query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [req.user.id]
    );

    return success(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.is_active,
              u.email_verified, u.last_login, u.created_at, u.updated_at,
              t.id as trainer_id, t.specialization, t.bio, t.years_experience, t.rating
       FROM users u
       LEFT JOIN trainers t ON u.id = t.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    const user = result.rows[0];

    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      email_verified: user.email_verified,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Add trainer info if applicable
    if (user.trainer_id) {
      profile.trainer = {
        id: user.trainer_id,
        specialization: user.specialization,
        bio: user.bio,
        years_experience: user.years_experience,
        rating: parseFloat(user.rating),
      };
    }

    return success(res, profile);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(full_name);
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (updates.length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, full_name, phone, role, email_verified, updated_at`,
      values
    );

    return success(res, result.rows[0], 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change password with old password verification
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current password hash and user email
    const result = await query(
      'SELECT password, email FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    // Validate new password strength with email context
    const passwordValidation = validatePassword(newPassword, user.email);
    if (!passwordValidation.isValid) {
      throw AppError.badRequest(passwordValidation.errors[0]);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Blacklist all existing tokens for security
    await blacklistAllUserTokens(req.user.id, 'password_change');

    // Update password
    await query(
      'UPDATE users SET password = $1, refresh_token = NULL WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    return success(res, null, 'Password changed successfully. Please log in again with your new password.');
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email address
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const result = await query(
      `SELECT id, email_verification_expires, email_verified
       FROM users
       WHERE email_verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw AppError.badRequest('Invalid verification token');
    }

    const user = result.rows[0];

    if (user.email_verified) {
      throw AppError.badRequest('Email is already verified');
    }

    if (new Date(user.email_verification_expires) < new Date()) {
      throw AppError.badRequest('Verification token has expired. Please request a new one');
    }

    // Update user as verified
    await query(
      `UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    return success(res, null, 'Email verified successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await query(
      'SELECT id, full_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    // Don't reveal if user exists or not
    if (result.rows.length === 0 || result.rows[0].email_verified) {
      return success(res, null, 'If an account exists and is not verified, a verification email will be sent');
    }

    const user = result.rows[0];

    // Generate new verification token
    const verificationData = generateEmailVerificationToken();

    // Update verification token
    await query(
      `UPDATE users SET email_verification_token = $1, email_verification_expires = $2
       WHERE id = $3`,
      [verificationData.token, verificationData.expires, user.id]
    );

    // Send verification email
    const emailData = prepareVerificationEmail(
      { ...user, email },
      verificationData.token
    );
    await sendEmail(emailData);

    return success(res, null, 'If an account exists and is not verified, a verification email will be sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await query(
      'SELECT id, full_name, email FROM users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return success(res, null, 'If an account exists with this email, a password reset link will be sent');
    }

    const user = result.rows[0];

    // Generate password reset token
    const resetData = generatePasswordResetToken();

    // Store reset token
    await query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2
       WHERE id = $3`,
      [resetData.token, resetData.expires, user.id]
    );

    // Send password reset email
    const emailData = preparePasswordResetEmail(user, resetData.token);
    await sendEmail(emailData);

    return success(res, null, 'If an account exists with this email, a password reset link will be sent');
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const result = await query(
      `SELECT id, email, password_reset_expires
       FROM users
       WHERE password_reset_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    const user = result.rows[0];

    if (new Date(user.password_reset_expires) < new Date()) {
      throw AppError.badRequest('Reset token has expired. Please request a new one');
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword, user.email);
    if (!passwordValidation.isValid) {
      throw AppError.badRequest(passwordValidation.errors[0]);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    // Blacklist all existing tokens
    await blacklistAllUserTokens(user.id, 'password_reset');

    // Update password and clear reset token
    await query(
      `UPDATE users SET password = $1, password_reset_token = NULL, password_reset_expires = NULL,
       refresh_token = NULL, login_attempts = 0, locked_until = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return success(res, null, 'Password reset successfully. Please log in with your new password');
  } catch (error) {
    next(error);
  }
};

/**
 * Get password requirements
 * GET /api/auth/password-requirements
 */
const getPasswordRequirements = async (req, res, next) => {
  try {
    const { getRequirementsText } = require('../utils/passwordValidator');
    return success(res, {
      requirements: getRequirementsText(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getPasswordRequirements,
};
