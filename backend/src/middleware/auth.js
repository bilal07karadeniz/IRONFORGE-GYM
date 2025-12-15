const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { query } = require('../config/database');

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided. Please include Authorization header with Bearer token');
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      throw AppError.unauthorized('Invalid token format');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw AppError.unauthorized('Invalid or expired token. Please log in again');
    }

    // Check if user still exists and is active
    const result = await query(
      `SELECT id, email, full_name, role, is_active, email_verified
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw AppError.unauthorized('User no longer exists');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw AppError.unauthorized('Your account has been deactivated. Please contact support');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      email_verified: user.email_verified,
    };

    // Attach token info
    req.tokenInfo = {
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Checks if authenticated user has one of the required roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
};

/**
 * Email verification requirement middleware
 * Ensures user has verified their email
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required'));
  }

  if (!req.user.email_verified) {
    return next(
      AppError.forbidden('Email verification required. Please verify your email address to access this resource')
    );
  }

  next();
};

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't require it
 * Useful for routes that have different behavior for authenticated vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      return next();
    }

    const decoded = verifyAccessToken(token);

    if (decoded) {
      const result = await query(
        `SELECT id, email, full_name, role, is_active, email_verified
         FROM users WHERE id = $1 AND is_active = true`,
        [decoded.id]
      );

      if (result.rows.length > 0) {
        req.user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          full_name: result.rows[0].full_name,
          role: result.rows[0].role,
          is_active: result.rows[0].is_active,
          email_verified: result.rows[0].email_verified,
        };
      }
    }

    next();
  } catch (error) {
    // Silent fail for optional auth - continue without user context
    next();
  }
};

/**
 * Resource ownership middleware factory
 * Creates middleware that checks if user owns the resource
 * @param {Function} getResourceUserId - Function to extract user_id from request
 */
const requireOwnership = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      // Admins bypass ownership check
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);

      if (resourceUserId !== req.user.id) {
        return next(AppError.forbidden('You do not have permission to access this resource'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin-only middleware
 * Shorthand for authorize('admin')
 */
const adminOnly = authorize('admin');

/**
 * Trainer or admin middleware
 * Shorthand for authorize('trainer', 'admin')
 */
const trainerOrAdmin = authorize('trainer', 'admin');

module.exports = {
  authenticate,
  authorize,
  requireEmailVerified,
  optionalAuth,
  requireOwnership,
  adminOnly,
  trainerOrAdmin,
};
