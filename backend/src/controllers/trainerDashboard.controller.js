const { query } = require('../config/database');
const AppError = require('../utils/AppError');
const { success, paginated } = require('../utils/response');

/**
 * Get trainer's profile ID from user ID
 */
const getTrainerProfile = async (userId) => {
  const result = await query(
    'SELECT id FROM trainers WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw AppError.badRequest('You are not registered as a trainer');
  }

  return result.rows[0].id;
};

/**
 * Get trainer's upcoming schedules
 * GET /api/trainer/my-schedules
 *
 * Returns the trainer's upcoming classes with booking details
 */
const getMySchedules = async (req, res, next) => {
  try {
    const trainerId = await getTrainerProfile(req.user.id);

    const {
      page = 1,
      limit = 20,
      status = 'active',
      from,
      to,
      include_past = 'false',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['s.trainer_id = $1'];
    const values = [trainerId];
    let paramCount = 2;

    if (status && status !== 'all') {
      conditions.push(`s.status = $${paramCount++}`);
      values.push(status);
    }

    if (include_past !== 'true') {
      conditions.push('s.start_time > NOW()');
    }

    if (from) {
      conditions.push(`s.start_time >= $${paramCount++}`);
      values.push(from);
    }

    if (to) {
      conditions.push(`s.start_time <= $${paramCount++}`);
      values.push(to);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM schedules s ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get schedules with class info and booking stats
    const result = await query(
      `SELECT s.id, s.class_id, s.start_time, s.end_time, s.status, s.room, s.notes,
              s.current_bookings, s.created_at,
              c.name as class_name, c.category, c.max_capacity, c.duration_minutes,
              c.difficulty_level,
              (c.max_capacity - s.current_bookings) as available_spots,
              CASE WHEN c.max_capacity <= s.current_bookings THEN true ELSE false END as is_full,
              (SELECT COUNT(*) FROM waiting_list wl WHERE wl.schedule_id = s.id) as waiting_list_count,
              (SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id AND b.status = 'confirmed') as confirmed_count,
              (SELECT COUNT(*) FROM bookings b WHERE b.schedule_id = s.id AND b.attended = true) as attended_count
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       ${whereClause}
       ORDER BY s.start_time ASC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    // Get summary stats
    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'active' AND start_time > NOW()) as upcoming_count,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
         COALESCE(SUM(current_bookings) FILTER (WHERE status = 'active' AND start_time > NOW()), 0) as total_upcoming_students
       FROM schedules
       WHERE trainer_id = $1`,
      [trainerId]
    );

    return paginated(res, result.rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      stats: {
        upcoming: parseInt(statsResult.rows[0].upcoming_count, 10),
        completed: parseInt(statsResult.rows[0].completed_count, 10),
        cancelled: parseInt(statsResult.rows[0].cancelled_count, 10),
        total_upcoming_students: parseInt(statsResult.rows[0].total_upcoming_students, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students in trainer's classes
 * GET /api/trainer/my-students
 *
 * Returns list of unique students who have booked trainer's classes
 */
const getMyStudents = async (req, res, next) => {
  try {
    const trainerId = await getTrainerProfile(req.user.id);

    const {
      page = 1,
      limit = 20,
      schedule_id,
      upcoming_only = 'false',
      search,
      sort_by = 'booking_count',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;

    // If schedule_id provided, get students for that specific schedule
    if (schedule_id) {
      // Verify schedule belongs to trainer
      const scheduleCheck = await query(
        'SELECT id FROM schedules WHERE id = $1 AND trainer_id = $2',
        [schedule_id, trainerId]
      );

      if (scheduleCheck.rows.length === 0) {
        throw AppError.notFound('Schedule not found or does not belong to you');
      }

      const result = await query(
        `SELECT b.id as booking_id, b.status, b.booking_date, b.attended, b.rating, b.feedback,
                u.id as user_id, u.full_name, u.email, u.phone,
                s.start_time, s.end_time, c.name as class_name
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN schedules s ON b.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         WHERE b.schedule_id = $1
         ORDER BY b.booking_date ASC`,
        [schedule_id]
      );

      return success(res, {
        schedule_id,
        students: result.rows,
        total: result.rows.length,
      });
    }

    // Get unique students across all trainer's classes
    const conditions = ['s.trainer_id = $1'];
    const values = [trainerId];
    let paramCount = 2;

    if (upcoming_only === 'true') {
      conditions.push('s.start_time > NOW()');
      conditions.push("b.status = 'confirmed'");
    }

    if (search) {
      conditions.push(`(u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Validate sort column
    const validSortColumns = ['booking_count', 'full_name', 'last_booking', 'average_rating'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'booking_count';
    const sortOrderClean = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const sortMapping = {
      booking_count: 'booking_count',
      full_name: 'u.full_name',
      last_booking: 'last_booking',
      average_rating: 'average_rating',
    };

    // Get total count of unique students
    const countResult = await query(
      `SELECT COUNT(DISTINCT u.id)
       FROM users u
       JOIN bookings b ON u.id = b.user_id
       JOIN schedules s ON b.schedule_id = s.id
       ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get unique students with their booking stats
    const result = await query(
      `SELECT
         u.id as user_id, u.full_name, u.email, u.phone,
         COUNT(b.id) as booking_count,
         COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_count,
         COUNT(b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_count,
         COUNT(b.id) FILTER (WHERE b.status = 'no_show') as no_show_count,
         COUNT(b.id) FILTER (WHERE b.attended = true) as attended_count,
         COALESCE(AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL), 0) as average_rating,
         COUNT(b.rating) as ratings_given,
         MAX(b.booking_date) as last_booking,
         MIN(b.booking_date) as first_booking,
         COUNT(b.id) FILTER (WHERE s.start_time > NOW() AND b.status = 'confirmed') as upcoming_bookings
       FROM users u
       JOIN bookings b ON u.id = b.user_id
       JOIN schedules s ON b.schedule_id = s.id
       ${whereClause}
       GROUP BY u.id, u.full_name, u.email, u.phone
       ORDER BY ${sortMapping[sortColumn]} ${sortOrderClean} NULLS LAST
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows.map(row => ({
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      stats: {
        total_bookings: parseInt(row.booking_count, 10),
        completed: parseInt(row.completed_count, 10),
        cancelled: parseInt(row.cancelled_count, 10),
        no_shows: parseInt(row.no_show_count, 10),
        attended: parseInt(row.attended_count, 10),
        average_rating: parseFloat(row.average_rating).toFixed(2),
        ratings_given: parseInt(row.ratings_given, 10),
        upcoming_bookings: parseInt(row.upcoming_bookings, 10),
      },
      first_booking: row.first_booking,
      last_booking: row.last_booking,
    })), {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer's dashboard stats
 * GET /api/trainer/stats
 */
const getTrainerStats = async (req, res, next) => {
  try {
    const trainerId = await getTrainerProfile(req.user.id);

    // Get trainer profile info
    const profileResult = await query(
      `SELECT t.*, u.full_name, u.email
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [trainerId]
    );

    const profile = profileResult.rows[0];

    // Get schedule stats
    const scheduleStats = await query(
      `SELECT
         COUNT(*) as total_schedules,
         COUNT(*) FILTER (WHERE status = 'active' AND start_time > NOW()) as upcoming,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
         COUNT(*) FILTER (WHERE DATE(start_time) = CURRENT_DATE AND status = 'active') as today
       FROM schedules
       WHERE trainer_id = $1`,
      [trainerId]
    );

    // Get booking stats
    const bookingStats = await query(
      `SELECT
         COUNT(b.id) as total_bookings,
         COUNT(b.id) FILTER (WHERE b.status = 'confirmed' AND s.start_time > NOW()) as upcoming_students,
         COUNT(b.id) FILTER (WHERE b.status = 'completed') as completed_bookings,
         COUNT(b.id) FILTER (WHERE b.status = 'no_show') as no_shows,
         COALESCE(AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL), 0) as average_rating,
         COUNT(b.rating) as total_ratings
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE s.trainer_id = $1`,
      [trainerId]
    );

    // Get unique student count
    const studentCount = await query(
      `SELECT COUNT(DISTINCT b.user_id) as unique_students
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE s.trainer_id = $1 AND b.status IN ('confirmed', 'completed')`,
      [trainerId]
    );

    // Get today's schedule
    const todaySchedule = await query(
      `SELECT s.id, s.start_time, s.end_time, s.room, s.current_bookings,
              c.name as class_name, c.max_capacity
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.trainer_id = $1 AND DATE(s.start_time) = CURRENT_DATE AND s.status = 'active'
       ORDER BY s.start_time ASC`,
      [trainerId]
    );

    return success(res, {
      profile: {
        name: profile.full_name,
        email: profile.email,
        specialization: profile.specialization,
        rating: parseFloat(profile.rating).toFixed(2),
        rating_count: profile.rating_count,
        years_experience: profile.years_experience,
        is_available: profile.is_available,
      },
      schedules: {
        total: parseInt(scheduleStats.rows[0].total_schedules, 10),
        upcoming: parseInt(scheduleStats.rows[0].upcoming, 10),
        completed: parseInt(scheduleStats.rows[0].completed, 10),
        cancelled: parseInt(scheduleStats.rows[0].cancelled, 10),
        today: parseInt(scheduleStats.rows[0].today, 10),
      },
      bookings: {
        total: parseInt(bookingStats.rows[0].total_bookings, 10),
        upcoming_students: parseInt(bookingStats.rows[0].upcoming_students, 10),
        completed: parseInt(bookingStats.rows[0].completed_bookings, 10),
        no_shows: parseInt(bookingStats.rows[0].no_shows, 10),
        average_rating: parseFloat(bookingStats.rows[0].average_rating).toFixed(2),
        total_ratings: parseInt(bookingStats.rows[0].total_ratings, 10),
      },
      unique_students: parseInt(studentCount.rows[0].unique_students, 10),
      today_schedule: todaySchedule.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySchedules,
  getMyStudents,
  getTrainerStats,
};
