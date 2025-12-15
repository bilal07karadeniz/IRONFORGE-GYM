const { query } = require('../config/database');
const AppError = require('../utils/AppError');
const { success, paginated } = require('../utils/response');

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 *
 * Returns overview metrics for the admin dashboard:
 * - Total users, trainers, classes
 * - Today's bookings and revenue
 * - Weekly/monthly comparisons
 * - Capacity utilization
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Get user statistics
    const userStats = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'member') as total_members,
        COUNT(*) FILTER (WHERE role = 'trainer') as total_trainers,
        COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month
      FROM users
    `);

    // Get class statistics
    const classStats = await query(`
      SELECT
        COUNT(*) as total_classes,
        COUNT(*) FILTER (WHERE is_active = true) as active_classes,
        COUNT(DISTINCT category) as total_categories
      FROM classes
    `);

    // Get schedule statistics
    const scheduleStats = await query(`
      SELECT
        COUNT(*) as total_schedules,
        COUNT(*) FILTER (WHERE status = 'active' AND start_time > NOW()) as upcoming_schedules,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_schedules,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_schedules,
        COUNT(*) FILTER (WHERE DATE(start_time) = CURRENT_DATE AND status = 'active') as today_schedules
      FROM schedules
    `);

    // Get booking statistics
    const bookingStats = await query(`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'no_show') as no_show_bookings,
        COUNT(*) FILTER (WHERE DATE(booking_date) = CURRENT_DATE) as today_bookings,
        COUNT(*) FILTER (WHERE booking_date >= NOW() - INTERVAL '7 days') as bookings_this_week,
        COUNT(*) FILTER (WHERE booking_date >= NOW() - INTERVAL '30 days') as bookings_this_month,
        COALESCE(AVG(rating) FILTER (WHERE rating IS NOT NULL), 0) as average_rating,
        COUNT(rating) as total_ratings
      FROM bookings
    `);

    // Get today's capacity utilization
    const capacityStats = await query(`
      SELECT
        COALESCE(SUM(s.current_bookings), 0) as total_booked_spots,
        COALESCE(SUM(c.max_capacity), 0) as total_capacity,
        CASE
          WHEN SUM(c.max_capacity) > 0
          THEN ROUND((SUM(s.current_bookings)::numeric / SUM(c.max_capacity)::numeric) * 100, 2)
          ELSE 0
        END as capacity_utilization_percent
      FROM schedules s
      JOIN classes c ON s.class_id = c.id
      WHERE DATE(s.start_time) = CURRENT_DATE AND s.status = 'active'
    `);

    // Get waiting list statistics
    const waitingListStats = await query(`
      SELECT
        COUNT(*) as total_waiting,
        COUNT(DISTINCT schedule_id) as schedules_with_waitlist
      FROM waiting_list wl
      JOIN schedules s ON wl.schedule_id = s.id
      WHERE s.start_time > NOW() AND s.status = 'active'
    `);

    // Get trainer statistics
    const trainerStats = await query(`
      SELECT
        COUNT(*) as total_trainers,
        COUNT(*) FILTER (WHERE is_available = true) as available_trainers,
        COALESCE(AVG(rating), 0) as average_trainer_rating,
        COALESCE(AVG(years_experience), 0) as average_experience
      FROM trainers
    `);

    // Get revenue projections (based on a hypothetical price per booking)
    // In a real app, this would come from actual pricing data
    const BOOKING_PRICE = 50; // Example price per booking
    const revenueStats = {
      today_projected: parseInt(bookingStats.rows[0].today_bookings, 10) * BOOKING_PRICE,
      week_projected: parseInt(bookingStats.rows[0].bookings_this_week, 10) * BOOKING_PRICE,
      month_projected: parseInt(bookingStats.rows[0].bookings_this_month, 10) * BOOKING_PRICE,
    };

    return success(res, {
      users: {
        total: parseInt(userStats.rows[0].total_users, 10),
        members: parseInt(userStats.rows[0].total_members, 10),
        trainers: parseInt(userStats.rows[0].total_trainers, 10),
        admins: parseInt(userStats.rows[0].total_admins, 10),
        active: parseInt(userStats.rows[0].active_users, 10),
        new_this_week: parseInt(userStats.rows[0].new_users_week, 10),
        new_this_month: parseInt(userStats.rows[0].new_users_month, 10),
      },
      classes: {
        total: parseInt(classStats.rows[0].total_classes, 10),
        active: parseInt(classStats.rows[0].active_classes, 10),
        categories: parseInt(classStats.rows[0].total_categories, 10),
      },
      schedules: {
        total: parseInt(scheduleStats.rows[0].total_schedules, 10),
        upcoming: parseInt(scheduleStats.rows[0].upcoming_schedules, 10),
        completed: parseInt(scheduleStats.rows[0].completed_schedules, 10),
        cancelled: parseInt(scheduleStats.rows[0].cancelled_schedules, 10),
        today: parseInt(scheduleStats.rows[0].today_schedules, 10),
      },
      bookings: {
        total: parseInt(bookingStats.rows[0].total_bookings, 10),
        confirmed: parseInt(bookingStats.rows[0].confirmed_bookings, 10),
        completed: parseInt(bookingStats.rows[0].completed_bookings, 10),
        cancelled: parseInt(bookingStats.rows[0].cancelled_bookings, 10),
        no_show: parseInt(bookingStats.rows[0].no_show_bookings, 10),
        today: parseInt(bookingStats.rows[0].today_bookings, 10),
        this_week: parseInt(bookingStats.rows[0].bookings_this_week, 10),
        this_month: parseInt(bookingStats.rows[0].bookings_this_month, 10),
        average_rating: parseFloat(bookingStats.rows[0].average_rating).toFixed(2),
        total_ratings: parseInt(bookingStats.rows[0].total_ratings, 10),
      },
      capacity: {
        today_booked_spots: parseInt(capacityStats.rows[0].total_booked_spots, 10),
        today_total_capacity: parseInt(capacityStats.rows[0].total_capacity, 10),
        utilization_percent: parseFloat(capacityStats.rows[0].capacity_utilization_percent) || 0,
      },
      waiting_list: {
        total_waiting: parseInt(waitingListStats.rows[0].total_waiting, 10),
        schedules_with_waitlist: parseInt(waitingListStats.rows[0].schedules_with_waitlist, 10),
      },
      trainers: {
        total: parseInt(trainerStats.rows[0].total_trainers, 10),
        available: parseInt(trainerStats.rows[0].available_trainers, 10),
        average_rating: parseFloat(trainerStats.rows[0].average_trainer_rating).toFixed(2),
        average_experience: parseFloat(trainerStats.rows[0].average_experience).toFixed(1),
      },
      revenue: revenueStats,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with filters
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      is_active,
      email_verified,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (role) {
      conditions.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount++}`);
      values.push(is_active === 'true');
    }

    if (email_verified !== undefined) {
      conditions.push(`email_verified = $${paramCount++}`);
      values.push(email_verified === 'true');
    }

    if (search) {
      conditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['created_at', 'full_name', 'email', 'role', 'last_login'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortOrderClean = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get users
    const result = await query(
      `SELECT id, email, full_name, phone, role, is_active, email_verified,
              last_login, login_attempts, locked_until, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY ${sortColumn} ${sortOrderClean} NULLS LAST
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['member', 'trainer', 'admin'];
    if (!validRoles.includes(role)) {
      throw AppError.badRequest(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check if user exists
    const userResult = await query('SELECT id, role, email FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    const user = userResult.rows[0];

    // Prevent changing own role (for safety)
    if (user.id === req.user.id) {
      throw AppError.badRequest('You cannot change your own role');
    }

    // Update role
    const result = await query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, role, is_active`,
      [role, id]
    );

    // If promoting to trainer, create trainer profile if not exists
    if (role === 'trainer') {
      const trainerExists = await query('SELECT id FROM trainers WHERE user_id = $1', [id]);
      if (trainerExists.rows.length === 0) {
        await query(
          `INSERT INTO trainers (user_id, specialization, bio, is_available)
           VALUES ($1, ARRAY['general'], 'New trainer', true)`,
          [id]
        );
      }
    }

    return success(res, result.rows[0], `User role updated to ${role}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings with advanced filters
 * GET /api/admin/bookings
 */
const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      trainer_id,
      class_id,
      category,
      from,
      to,
      date,
      has_rating,
      sort_by = 'booking_date',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`b.status = $${paramCount++}`);
      values.push(status);
    }

    if (user_id) {
      conditions.push(`b.user_id = $${paramCount++}`);
      values.push(user_id);
    }

    if (trainer_id) {
      conditions.push(`s.trainer_id = $${paramCount++}`);
      values.push(trainer_id);
    }

    if (class_id) {
      conditions.push(`s.class_id = $${paramCount++}`);
      values.push(class_id);
    }

    if (category) {
      conditions.push(`c.category = $${paramCount++}`);
      values.push(category);
    }

    if (date) {
      conditions.push(`DATE(s.start_time) = $${paramCount++}`);
      values.push(date);
    } else {
      if (from) {
        conditions.push(`s.start_time >= $${paramCount++}`);
        values.push(from);
      }
      if (to) {
        conditions.push(`s.start_time <= $${paramCount++}`);
        values.push(to);
      }
    }

    if (has_rating === 'true') {
      conditions.push('b.rating IS NOT NULL');
    } else if (has_rating === 'false') {
      conditions.push('b.rating IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['booking_date', 'start_time', 'status', 'rating', 'user_name', 'class_name'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'booking_date';
    const sortOrderClean = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const sortMapping = {
      booking_date: 'b.booking_date',
      start_time: 's.start_time',
      status: 'b.status',
      rating: 'b.rating',
      user_name: 'bu.full_name',
      class_name: 'c.name',
    };

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get bookings
    const result = await query(
      `SELECT b.id, b.user_id, b.schedule_id, b.status, b.booking_date,
              b.cancelled_at, b.cancellation_reason, b.attended, b.rating, b.feedback,
              s.start_time, s.end_time, s.room,
              c.id as class_id, c.name as class_name, c.category,
              bu.full_name as user_name, bu.email as user_email,
              tu.full_name as trainer_name, t.id as trainer_id
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN classes c ON s.class_id = c.id
       JOIN users bu ON b.user_id = bu.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users tu ON t.user_id = tu.id
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
 * Get popular classes report
 * GET /api/admin/reports/popular-classes
 */
const getPopularClassesReport = async (req, res, next) => {
  try {
    const { period = '30', limit = 10 } = req.query;
    const days = parseInt(period, 10) || 30;

    const result = await query(
      `SELECT
         c.id, c.name, c.category, c.difficulty_level,
         COUNT(DISTINCT s.id) as total_schedules,
         COUNT(b.id) as total_bookings,
         COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
         COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
         COALESCE(AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL), 0) as average_rating,
         COUNT(b.rating) as total_ratings,
         SUM(c.max_capacity) as total_capacity,
         CASE
           WHEN SUM(c.max_capacity) > 0
           THEN ROUND((COUNT(b.id)::numeric / SUM(c.max_capacity)::numeric) * 100, 2)
           ELSE 0
         END as booking_rate_percent
       FROM classes c
       LEFT JOIN schedules s ON c.id = s.class_id AND s.start_time >= NOW() - INTERVAL '${days} days'
       LEFT JOIN bookings b ON s.id = b.schedule_id
       WHERE c.is_active = true
       GROUP BY c.id, c.name, c.category, c.difficulty_level
       ORDER BY total_bookings DESC
       LIMIT $1`,
      [limit]
    );

    // Get category breakdown
    const categoryStats = await query(
      `SELECT
         c.category,
         COUNT(DISTINCT c.id) as class_count,
         COUNT(b.id) as total_bookings,
         COALESCE(AVG(b.rating), 0) as average_rating
       FROM classes c
       LEFT JOIN schedules s ON c.id = s.class_id AND s.start_time >= NOW() - INTERVAL '${days} days'
       LEFT JOIN bookings b ON s.id = b.schedule_id
       WHERE c.is_active = true
       GROUP BY c.category
       ORDER BY total_bookings DESC`
    );

    return success(res, {
      period_days: days,
      popular_classes: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        difficulty_level: row.difficulty_level,
        total_schedules: parseInt(row.total_schedules, 10),
        total_bookings: parseInt(row.total_bookings, 10),
        completed_bookings: parseInt(row.completed_bookings, 10),
        cancelled_bookings: parseInt(row.cancelled_bookings, 10),
        average_rating: parseFloat(row.average_rating).toFixed(2),
        total_ratings: parseInt(row.total_ratings, 10),
        booking_rate_percent: parseFloat(row.booking_rate_percent) || 0,
      })),
      category_breakdown: categoryStats.rows.map(row => ({
        category: row.category,
        class_count: parseInt(row.class_count, 10),
        total_bookings: parseInt(row.total_bookings, 10),
        average_rating: parseFloat(row.average_rating).toFixed(2),
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer performance report
 * GET /api/admin/reports/trainer-performance
 */
const getTrainerPerformanceReport = async (req, res, next) => {
  try {
    const { period = '30', limit = 20 } = req.query;
    const days = parseInt(period, 10) || 30;

    const result = await query(
      `SELECT
         t.id as trainer_id,
         u.full_name as trainer_name,
         u.email as trainer_email,
         t.specialization,
         t.rating as overall_rating,
         t.rating_count,
         t.years_experience,
         t.is_available,
         COUNT(DISTINCT s.id) as total_schedules,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed_schedules,
         COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'cancelled') as cancelled_schedules,
         COUNT(b.id) as total_bookings,
         COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
         COUNT(b.id) FILTER (WHERE b.status = 'no_show') as no_show_count,
         COALESCE(AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL), 0) as period_average_rating,
         COUNT(b.rating) as period_ratings,
         SUM(c.max_capacity) FILTER (WHERE s.status != 'cancelled') as total_capacity,
         SUM(s.current_bookings) FILTER (WHERE s.status != 'cancelled') as total_booked,
         CASE
           WHEN SUM(c.max_capacity) FILTER (WHERE s.status != 'cancelled') > 0
           THEN ROUND(
             (SUM(s.current_bookings) FILTER (WHERE s.status != 'cancelled')::numeric /
              SUM(c.max_capacity) FILTER (WHERE s.status != 'cancelled')::numeric) * 100, 2
           )
           ELSE 0
         END as capacity_utilization
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN schedules s ON t.id = s.trainer_id AND s.start_time >= NOW() - INTERVAL '${days} days'
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN bookings b ON s.id = b.schedule_id
       GROUP BY t.id, u.full_name, u.email, t.specialization, t.rating, t.rating_count,
                t.years_experience, t.is_available
       ORDER BY total_bookings DESC, overall_rating DESC
       LIMIT $1`,
      [limit]
    );

    // Calculate summary statistics
    const summaryResult = await query(`
      SELECT
        COUNT(DISTINCT t.id) as total_trainers,
        AVG(t.rating) as avg_overall_rating,
        AVG(t.years_experience) as avg_experience
      FROM trainers t
      JOIN users u ON t.user_id = u.id
      WHERE u.is_active = true
    `);

    return success(res, {
      period_days: days,
      summary: {
        total_trainers: parseInt(summaryResult.rows[0].total_trainers, 10),
        average_rating: parseFloat(summaryResult.rows[0].avg_overall_rating || 0).toFixed(2),
        average_experience: parseFloat(summaryResult.rows[0].avg_experience || 0).toFixed(1),
      },
      trainers: result.rows.map(row => ({
        trainer_id: row.trainer_id,
        trainer_name: row.trainer_name,
        trainer_email: row.trainer_email,
        specialization: row.specialization,
        years_experience: row.years_experience,
        is_available: row.is_available,
        overall_rating: parseFloat(row.overall_rating).toFixed(2),
        total_ratings: parseInt(row.rating_count, 10),
        period_stats: {
          schedules: parseInt(row.total_schedules, 10),
          completed_schedules: parseInt(row.completed_schedules, 10),
          cancelled_schedules: parseInt(row.cancelled_schedules, 10),
          total_bookings: parseInt(row.total_bookings, 10),
          completed_bookings: parseInt(row.completed_bookings, 10),
          no_shows: parseInt(row.no_show_count, 10),
          average_rating: parseFloat(row.period_average_rating).toFixed(2),
          ratings_received: parseInt(row.period_ratings, 10),
          capacity_utilization: parseFloat(row.capacity_utilization) || 0,
        },
      })),
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user account
 * PUT /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Check if user exists
    const userResult = await query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    // Prevent deactivating yourself
    if (userResult.rows[0].id === req.user.id) {
      throw AppError.badRequest('You cannot deactivate your own account');
    }

    const result = await query(
      `UPDATE users SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, full_name, role, is_active`,
      [is_active, id]
    );

    const action = is_active ? 'activated' : 'deactivated';
    return success(res, result.rows[0], `User account ${action} successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getAllBookingsAdmin,
  getPopularClassesReport,
  getTrainerPerformanceReport,
};
