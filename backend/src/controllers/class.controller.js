const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { success, created, paginated } = require('../utils/response');

/**
 * Create a new class
 * POST /api/classes
 */
const createClass = async (req, res, next) => {
  try {
    const {
      name,
      description,
      duration_minutes,
      max_capacity,
      trainer_id,
      category,
      difficulty_level = 'intermediate',
      equipment_needed,
    } = req.body;

    // Check if class name already exists
    const existingClass = await query(
      'SELECT id FROM classes WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (existingClass.rows.length > 0) {
      throw AppError.conflict('A class with this name already exists');
    }

    // Verify trainer exists if provided
    if (trainer_id) {
      const trainerResult = await query(
        `SELECT t.id, u.full_name
         FROM trainers t
         JOIN users u ON t.user_id = u.id
         WHERE t.id = $1`,
        [trainer_id]
      );
      if (trainerResult.rows.length === 0) {
        throw AppError.notFound('Trainer not found');
      }
    }

    const result = await query(
      `INSERT INTO classes (name, description, duration_minutes, max_capacity, trainer_id, category, difficulty_level, equipment_needed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, duration_minutes, max_capacity, trainer_id, category, difficulty_level, equipment_needed]
    );

    // Fetch with trainer info
    const fullClass = await query(
      `SELECT c.*, u.full_name as trainer_name
       FROM classes c
       LEFT JOIN trainers t ON c.trainer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );

    return created(res, fullClass.rows[0], 'Class created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all classes with filters, search, and sorting
 * GET /api/classes
 */
const getAllClasses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      difficulty,
      trainer_id,
      active,
      search,
      min_duration,
      max_duration,
      min_capacity,
      max_capacity,
      sort_by = 'name',
      sort_order = 'asc',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Filter by category
    if (category) {
      conditions.push(`c.category = $${paramCount++}`);
      values.push(category);
    }

    // Filter by difficulty level
    if (difficulty) {
      conditions.push(`c.difficulty_level = $${paramCount++}`);
      values.push(difficulty);
    }

    // Filter by trainer
    if (trainer_id) {
      conditions.push(`c.trainer_id = $${paramCount++}`);
      values.push(trainer_id);
    }

    // Filter by active status
    if (active !== undefined) {
      conditions.push(`c.is_active = $${paramCount++}`);
      values.push(active === 'true');
    }

    // Search by name or description
    if (search) {
      conditions.push(`(c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filter by duration range
    if (min_duration) {
      conditions.push(`c.duration_minutes >= $${paramCount++}`);
      values.push(parseInt(min_duration, 10));
    }

    if (max_duration) {
      conditions.push(`c.duration_minutes <= $${paramCount++}`);
      values.push(parseInt(max_duration, 10));
    }

    // Filter by capacity range
    if (min_capacity) {
      conditions.push(`c.max_capacity >= $${paramCount++}`);
      values.push(parseInt(min_capacity, 10));
    }

    if (max_capacity) {
      conditions.push(`c.max_capacity <= $${paramCount++}`);
      values.push(parseInt(max_capacity, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate and map sort columns
    const validSortColumns = ['name', 'category', 'duration_minutes', 'max_capacity', 'difficulty_level', 'created_at', 'trainer_name'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name';
    const sortOrderClean = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const sortMapping = {
      name: 'c.name',
      category: 'c.category',
      duration_minutes: 'c.duration_minutes',
      max_capacity: 'c.max_capacity',
      difficulty_level: 'c.difficulty_level',
      created_at: 'c.created_at',
      trainer_name: 'u.full_name',
    };

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM classes c
       LEFT JOIN trainers t ON c.trainer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get classes with trainer info and upcoming schedule count
    const result = await query(
      `SELECT c.id, c.name, c.description, c.duration_minutes, c.max_capacity,
              c.trainer_id, c.category, c.difficulty_level, c.equipment_needed,
              c.is_active, c.created_at, c.updated_at,
              t.id as trainer_profile_id, t.rating as trainer_rating,
              u.full_name as trainer_name,
              (SELECT COUNT(*) FROM schedules s
               WHERE s.class_id = c.id AND s.status = 'active' AND s.start_time > NOW()
              ) as upcoming_schedules_count
       FROM classes c
       LEFT JOIN trainers t ON c.trainer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY ${sortMapping[sortColumn]} ${sortOrderClean} NULLS LAST
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get class by ID with full details
 * GET /api/classes/:id
 */
const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*,
              t.id as trainer_profile_id, t.specialization, t.rating as trainer_rating,
              t.bio as trainer_bio, t.years_experience,
              u.full_name as trainer_name, u.email as trainer_email
       FROM classes c
       LEFT JOIN trainers t ON c.trainer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('Class not found');
    }

    // Get upcoming schedules for this class
    const schedulesResult = await query(
      `SELECT s.id, s.start_time, s.end_time, s.current_bookings, s.status, s.room,
              s.trainer_id, c.max_capacity,
              (c.max_capacity - s.current_bookings) as available_spots,
              u.full_name as trainer_name
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE s.class_id = $1 AND s.start_time > NOW() AND s.status = 'active'
       ORDER BY s.start_time ASC
       LIMIT 10`,
      [id]
    );

    // Get class statistics
    const statsResult = await query(
      `SELECT
         COUNT(DISTINCT s.id) as total_schedules,
         COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_schedules,
         COALESCE(SUM(s.current_bookings), 0) as total_bookings,
         COALESCE(AVG(b.rating), 0) as average_rating,
         COUNT(DISTINCT b.rating) as rating_count
       FROM schedules s
       LEFT JOIN bookings b ON s.id = b.schedule_id AND b.rating IS NOT NULL
       WHERE s.class_id = $1`,
      [id]
    );

    const classData = result.rows[0];
    classData.upcoming_schedules = schedulesResult.rows;
    classData.stats = {
      total_schedules: parseInt(statsResult.rows[0].total_schedules, 10),
      completed_schedules: parseInt(statsResult.rows[0].completed_schedules, 10),
      total_bookings: parseInt(statsResult.rows[0].total_bookings, 10),
      average_rating: parseFloat(statsResult.rows[0].average_rating) || 0,
      rating_count: parseInt(statsResult.rows[0].rating_count, 10),
    };

    return success(res, classData);
  } catch (error) {
    next(error);
  }
};

/**
 * Update class
 * PUT /api/classes/:id
 */
const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      duration_minutes,
      max_capacity,
      trainer_id,
      category,
      difficulty_level,
      equipment_needed,
      is_active,
    } = req.body;

    // Check if class exists
    const existingClass = await query(
      'SELECT id, max_capacity FROM classes WHERE id = $1',
      [id]
    );

    if (existingClass.rows.length === 0) {
      throw AppError.notFound('Class not found');
    }

    // Check if name already exists (for another class)
    if (name) {
      const nameCheck = await query(
        'SELECT id FROM classes WHERE LOWER(name) = LOWER($1) AND id != $2',
        [name, id]
      );
      if (nameCheck.rows.length > 0) {
        throw AppError.conflict('A class with this name already exists');
      }
    }

    // Verify trainer exists if provided
    if (trainer_id) {
      const trainerResult = await query('SELECT id FROM trainers WHERE id = $1', [trainer_id]);
      if (trainerResult.rows.length === 0) {
        throw AppError.notFound('Trainer not found');
      }
    }

    // Check if reducing capacity would affect existing schedules
    if (max_capacity !== undefined && max_capacity < existingClass.rows[0].max_capacity) {
      const affectedSchedules = await query(
        `SELECT s.id, s.current_bookings, s.start_time
         FROM schedules s
         WHERE s.class_id = $1 AND s.status = 'active' AND s.start_time > NOW()
         AND s.current_bookings > $2`,
        [id, max_capacity]
      );

      if (affectedSchedules.rows.length > 0) {
        throw AppError.conflict(
          `Cannot reduce capacity to ${max_capacity}. ${affectedSchedules.rows.length} upcoming schedule(s) ` +
          `have more bookings than the new capacity.`
        );
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (duration_minutes !== undefined) {
      updates.push(`duration_minutes = $${paramCount++}`);
      values.push(duration_minutes);
    }

    if (max_capacity !== undefined) {
      updates.push(`max_capacity = $${paramCount++}`);
      values.push(max_capacity);
    }

    if (trainer_id !== undefined) {
      updates.push(`trainer_id = $${paramCount++}`);
      values.push(trainer_id);
    }

    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }

    if (difficulty_level !== undefined) {
      updates.push(`difficulty_level = $${paramCount++}`);
      values.push(difficulty_level);
    }

    if (equipment_needed !== undefined) {
      updates.push(`equipment_needed = $${paramCount++}`);
      values.push(equipment_needed);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw AppError.badRequest('No fields to update');
    }

    values.push(id);

    const result = await query(
      `UPDATE classes SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    // Fetch with trainer info
    const fullClass = await query(
      `SELECT c.*, u.full_name as trainer_name
       FROM classes c
       LEFT JOIN trainers t ON c.trainer_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    return success(res, fullClass.rows[0], 'Class updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete class (only if no active schedules)
 * DELETE /api/classes/:id
 */
const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if class exists
    const classResult = await query('SELECT id, name FROM classes WHERE id = $1', [id]);

    if (classResult.rows.length === 0) {
      throw AppError.notFound('Class not found');
    }

    // Check for active upcoming schedules
    const activeSchedules = await query(
      `SELECT id FROM schedules WHERE class_id = $1 AND status = 'active' AND start_time > NOW()`,
      [id]
    );

    if (activeSchedules.rows.length > 0) {
      throw AppError.conflict(
        `Cannot delete class with ${activeSchedules.rows.length} active upcoming schedule(s). ` +
        `Cancel or complete these schedules first.`
      );
    }

    // Check for any past schedules with bookings (for audit purposes)
    const pastSchedules = await query(
      `SELECT COUNT(*) as count FROM schedules WHERE class_id = $1`,
      [id]
    );

    if (parseInt(pastSchedules.rows[0].count, 10) > 0) {
      // Soft delete by marking inactive instead of hard delete
      await query(
        'UPDATE classes SET is_active = false WHERE id = $1',
        [id]
      );
      return success(res, null, 'Class has been deactivated (has historical schedules)');
    }

    // Hard delete if no schedules exist
    await query('DELETE FROM classes WHERE id = $1', [id]);

    return success(res, null, 'Class deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all class categories
 * GET /api/classes/categories
 */
const getClassCategories = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT unnest(enum_range(NULL::class_category))::text as category`
    );

    // Also get count of classes per category
    const countResult = await query(
      `SELECT category::text, COUNT(*) as count
       FROM classes
       WHERE is_active = true
       GROUP BY category`
    );

    const countMap = countResult.rows.reduce((acc, row) => {
      acc[row.category] = parseInt(row.count, 10);
      return acc;
    }, {});

    const categories = result.rows.map(r => ({
      name: r.category,
      class_count: countMap[r.category] || 0,
    }));

    return success(res, categories);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassCategories,
};
