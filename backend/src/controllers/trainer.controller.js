const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { success, created, paginated } = require('../utils/response');

const createTrainer = async (req, res, next) => {
  try {
    const { user_id, specialization, bio, years_experience = 0, hourly_rate } = req.body;

    // Verify user exists and is marked as trainer role
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    // Update user role to trainer if not already
    if (userResult.rows[0].role !== 'trainer') {
      await query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['trainer', user_id]
      );
    }

    // Check if trainer profile already exists
    const existingTrainer = await query(
      'SELECT id FROM trainers WHERE user_id = $1',
      [user_id]
    );

    if (existingTrainer.rows.length > 0) {
      throw AppError.conflict('Trainer profile already exists for this user');
    }

    // Create trainer profile
    const result = await query(
      `INSERT INTO trainers (user_id, specialization, bio, years_experience, hourly_rate)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, specialization, bio, years_experience, hourly_rate]
    );

    return created(res, result.rows[0], 'Trainer profile created successfully');
  } catch (error) {
    next(error);
  }
};

const getAllTrainers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      available,
      sort_by = 'rating',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (specialization) {
      conditions.push(`t.specialization ILIKE $${paramCount++}`);
      values.push(`%${specialization}%`);
    }

    if (available !== undefined) {
      conditions.push(`t.is_available = $${paramCount++}`);
      values.push(available === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort columns
    const validSortColumns = ['rating', 'years_experience', 'created_at', 'full_name'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'rating';
    const sortOrderClean = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM trainers t
       JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get trainers with user info
    const result = await query(
      `SELECT t.id, t.user_id, t.specialization, t.bio, t.years_experience,
              t.rating, t.rating_count, t.hourly_rate, t.is_available, t.created_at,
              u.full_name, u.email, u.phone
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY ${sortColumn === 'full_name' ? 'u.full_name' : `t.${sortColumn}`} ${sortOrderClean}
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

const getTrainerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.id, t.user_id, t.specialization, t.bio, t.years_experience,
              t.rating, t.rating_count, t.hourly_rate, t.is_available, t.created_at, t.updated_at,
              u.full_name, u.email, u.phone
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('Trainer not found');
    }

    // Get trainer's upcoming classes
    const classesResult = await query(
      `SELECT c.id, c.name, c.category, c.duration_minutes,
              s.id as schedule_id, s.start_time, s.end_time, s.current_bookings, s.status,
              c.max_capacity
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.trainer_id = $1 AND s.start_time > NOW() AND s.status = 'active'
       ORDER BY s.start_time ASC
       LIMIT 10`,
      [id]
    );

    const trainer = result.rows[0];
    trainer.upcoming_classes = classesResult.rows;

    return success(res, trainer);
  } catch (error) {
    next(error);
  }
};

const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specialization, bio, years_experience, hourly_rate, is_available } = req.body;

    // Check if trainer exists
    const existingTrainer = await query(
      'SELECT id, user_id FROM trainers WHERE id = $1',
      [id]
    );

    if (existingTrainer.rows.length === 0) {
      throw AppError.notFound('Trainer not found');
    }

    // Check authorization - only admin or the trainer themselves can update
    if (req.user.role !== 'admin' && req.user.id !== existingTrainer.rows[0].user_id) {
      throw AppError.forbidden('You are not authorized to update this trainer profile');
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (specialization !== undefined) {
      updates.push(`specialization = $${paramCount++}`);
      values.push(specialization);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (years_experience !== undefined) {
      updates.push(`years_experience = $${paramCount++}`);
      values.push(years_experience);
    }

    if (hourly_rate !== undefined) {
      updates.push(`hourly_rate = $${paramCount++}`);
      values.push(hourly_rate);
    }

    if (is_available !== undefined) {
      updates.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }

    if (updates.length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE trainers SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return success(res, result.rows[0], 'Trainer profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM trainers WHERE id = $1 RETURNING user_id',
      [id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('Trainer not found');
    }

    // Update user role back to member
    await query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['member', result.rows[0].user_id]
    );

    return success(res, null, 'Trainer profile deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getTrainerSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { from, to, status = 'active' } = req.query;

    // Verify trainer exists
    const trainerResult = await query('SELECT id FROM trainers WHERE id = $1', [id]);

    if (trainerResult.rows.length === 0) {
      throw AppError.notFound('Trainer not found');
    }

    let dateFilter = '';
    const values = [id];
    let paramCount = 2;

    if (from) {
      dateFilter += ` AND s.start_time >= $${paramCount++}`;
      values.push(from);
    }

    if (to) {
      dateFilter += ` AND s.start_time <= $${paramCount++}`;
      values.push(to);
    }

    if (status) {
      dateFilter += ` AND s.status = $${paramCount}`;
      values.push(status);
    }

    const result = await query(
      `SELECT s.id, s.start_time, s.end_time, s.current_bookings, s.status, s.room,
              c.id as class_id, c.name as class_name, c.category, c.max_capacity, c.duration_minutes
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.trainer_id = $1 ${dateFilter}
       ORDER BY s.start_time ASC`,
      values
    );

    return success(res, result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
  getTrainerSchedule,
};
