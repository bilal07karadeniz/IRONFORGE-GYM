const crypto = require('crypto');
const { query } = require('../config/database');

/**
 * Hash a token for secure storage
 * @param {string} token - The token to hash
 * @returns {string} - The hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Add a token to the blacklist
 * @param {string} token - The refresh token to blacklist
 * @param {string} userId - The user ID associated with the token
 * @param {Date} expiresAt - When the token expires
 * @param {string} reason - Reason for blacklisting (logout, security, password_change)
 */
const blacklistToken = async (token, userId, expiresAt, reason = 'logout') => {
  const tokenHash = hashToken(token);

  await query(
    `INSERT INTO token_blacklist (token_hash, user_id, expires_at, reason)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (token_hash) DO NOTHING`,
    [tokenHash, userId, expiresAt, reason]
  );
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The token to check
 * @returns {boolean} - True if blacklisted
 */
const isTokenBlacklisted = async (token) => {
  const tokenHash = hashToken(token);

  const result = await query(
    'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );

  return result.rows.length > 0;
};

/**
 * Blacklist all tokens for a user (e.g., on password change)
 * @param {string} userId - The user ID
 * @param {string} reason - Reason for blacklisting
 */
const blacklistAllUserTokens = async (userId, reason = 'security') => {
  // Get the user's current refresh token if stored
  const userResult = await query(
    'SELECT refresh_token FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows[0]?.refresh_token) {
    // Blacklist the current refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await blacklistToken(
      userResult.rows[0].refresh_token,
      userId,
      expiresAt,
      reason
    );
  }

  // Clear the refresh token in the users table
  await query(
    'UPDATE users SET refresh_token = NULL WHERE id = $1',
    [userId]
  );
};

/**
 * Clean up expired tokens from the blacklist
 * This should be run periodically (e.g., via cron job)
 */
const cleanupExpiredTokens = async () => {
  const result = await query(
    'DELETE FROM token_blacklist WHERE expires_at < NOW() RETURNING id'
  );

  return result.rowCount;
};

/**
 * Get blacklist statistics
 */
const getBlacklistStats = async () => {
  const result = await query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE expires_at > NOW()) as active,
      COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired,
      COUNT(DISTINCT user_id) as unique_users
    FROM token_blacklist
  `);

  return result.rows[0];
};

module.exports = {
  hashToken,
  blacklistToken,
  isTokenBlacklisted,
  blacklistAllUserTokens,
  cleanupExpiredTokens,
  getBlacklistStats,
};
