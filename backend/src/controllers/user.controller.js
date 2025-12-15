const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const config = require('../config');
const AppError = require('../utils/AppError');
const { success, paginated } = require('../utils/response');

const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      active,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (role) {
      conditions.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(active === 'true');
    }

    if (search) {
      conditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount++})`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get users
    const result = await query(
      `SELECT id, email, full_name, phone, role, is_active, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at, u.updated_at,
              t.id as trainer_id, t.specialization, t.bio, t.years_experience, t.rating
       FROM users u
       LEFT JOIN trainers t ON u.id = t.user_id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    const user = result.rows[0];

    // Get user's booking stats
    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
         COUNT(*) FILTER (WHERE status = 'no_show') as no_shows
       FROM bookings
       WHERE user_id = $1`,
      [id]
    );

    user.booking_stats = statsResult.rows[0];

    return success(res, user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, is_active } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);

    if (existingUser.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

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

    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);

      // If deactivating, clear refresh token
      if (!is_active) {
        updates.push('refresh_token = NULL');
      }
    }

    if (updates.length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, full_name, phone, role, is_active, updated_at`,
      values
    );

    return success(res, result.rows[0], 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      throw AppError.badRequest('You cannot delete your own account');
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    return success(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);

    if (existingUser.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, config.bcrypt.saltRounds);

    // Update password and clear refresh token
    await query(
      'UPDATE users SET password = $1, refresh_token = NULL WHERE id = $2',
      [hashedPassword, id]
    );

    return success(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  resetUserPassword,
};
