const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { success, created, paginated } = require('../utils/response');

// Constants
const CANCELLATION_WINDOW_HOURS = 2;

/**
 * Helper: Check for booking conflicts (user has another booking at same time)
 */
const checkBookingConflicts = async (client, userId, scheduleId) => {
  const conflictResult = await client.query(
    `SELECT b.id, c.name as class_name, s.start_time, s.end_time
     FROM bookings b
     JOIN schedules s ON b.schedule_id = s.id
     JOIN classes c ON s.class_id = c.id
     WHERE b.user_id = $1 AND b.status = 'confirmed'
     AND s.id != $2
     AND EXISTS (
       SELECT 1 FROM schedules target
       WHERE target.id = $2
       AND (
         (s.start_time < target.end_time AND s.end_time > target.start_time)
       )
     )`,
    [userId, scheduleId]
  );

  return conflictResult.rows;
};

/**
 * Helper: Promote next person from waiting list
 */
const promoteFromWaitingList = async (client, scheduleId) => {
  // Get first person on waiting list
  const nextInLine = await client.query(
    `SELECT wl.*, u.email, u.full_name
     FROM waiting_list wl
     JOIN users u ON wl.user_id = u.id
     WHERE wl.schedule_id = $1
     ORDER BY wl.position ASC
     LIMIT 1
     FOR UPDATE`,
    [scheduleId]
  );

  if (nextInLine.rows.length === 0) {
    return null;
  }

  const waitingEntry = nextInLine.rows[0];

  // Mark as notified with expiration (24 hours to confirm)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await client.query(
    `UPDATE waiting_list
     SET notified = true, notified_at = NOW(), expires_at = $1
     WHERE id = $2`,
    [expiresAt, waitingEntry.id]
  );

  // Log notification (in production, send actual email)
  console.log(`[EMAIL] Waiting list notification sent to ${waitingEntry.full_name} (${waitingEntry.email})`);
  console.log(`  Schedule ID: ${scheduleId}`);
  console.log(`  Expires at: ${expiresAt.toISOString()}`);

  return {
    userId: waitingEntry.user_id,
    email: waitingEntry.email,
    fullName: waitingEntry.full_name,
    expiresAt,
  };
};

/**
 * Helper: Prepare booking confirmation email data
 */
const prepareBookingConfirmationEmail = (booking, user) => {
  return {
    to: user.email,
    subject: `Booking Confirmed: ${booking.class_name}`,
    data: {
      userName: user.full_name,
      className: booking.class_name,
      trainerName: booking.trainer_name,
      startTime: booking.start_time,
      endTime: booking.end_time,
      room: booking.room,
      bookingId: booking.id,
    },
  };
};

/**
 * Create a new booking
 * POST /api/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    const { schedule_id } = req.body;
    const user_id = req.user.id;

    const result = await transaction(async (client) => {
      // Get schedule with class info (lock for update)
      const scheduleResult = await client.query(
        `SELECT s.*, c.max_capacity, c.name as class_name, c.category,
                t.user_id as trainer_user_id, u.full_name as trainer_name
         FROM schedules s
         JOIN classes c ON s.class_id = c.id
         JOIN trainers t ON s.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE s.id = $1
         FOR UPDATE`,
        [schedule_id]
      );

      if (scheduleResult.rows.length === 0) {
        throw AppError.notFound('Schedule not found');
      }

      const schedule = scheduleResult.rows[0];

      // Check if schedule is active
      if (schedule.status !== 'active') {
        throw AppError.badRequest('This schedule is not available for booking');
      }

      // Check if schedule is in the future
      if (new Date(schedule.start_time) <= new Date()) {
        throw AppError.badRequest('Cannot book a class that has already started');
      }

      // Check if user already has a booking for this schedule
      const existingBooking = await client.query(
        `SELECT id, status FROM bookings WHERE user_id = $1 AND schedule_id = $2`,
        [user_id, schedule_id]
      );

      if (existingBooking.rows.length > 0) {
        const existing = existingBooking.rows[0];
        if (existing.status === 'confirmed') {
          throw AppError.conflict('You already have a booking for this class');
        }
        if (existing.status === 'cancelled') {
          // Check capacity before reactivating
          if (schedule.current_bookings >= schedule.max_capacity) {
            throw AppError.badRequest('This class is now full. Please join the waiting list.');
          }

          // Check for time conflicts before reactivating
          const conflicts = await checkBookingConflicts(client, user_id, schedule_id);
          if (conflicts.length > 0) {
            throw AppError.conflict(
              `You have a conflicting booking for "${conflicts[0].class_name}" at ${new Date(conflicts[0].start_time).toLocaleString()}`
            );
          }

          // Reactivate cancelled booking
          await client.query(
            `UPDATE bookings SET status = 'confirmed', cancelled_at = NULL,
             cancellation_reason = NULL, booking_date = NOW()
             WHERE id = $1`,
            [existing.id]
          );

          // Update schedule bookings count
          await client.query(
            'UPDATE schedules SET current_bookings = current_bookings + 1 WHERE id = $1',
            [schedule_id]
          );

          const reactivatedBooking = await client.query(
            `SELECT b.*, s.start_time, s.end_time, s.room, c.name as class_name,
                    c.category, u.full_name as trainer_name
             FROM bookings b
             JOIN schedules s ON b.schedule_id = s.id
             JOIN classes c ON s.class_id = c.id
             JOIN trainers t ON s.trainer_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE b.id = $1`,
            [existing.id]
          );

          return { booking: reactivatedBooking.rows[0], reactivated: true };
        }
      }

      // Check capacity
      if (schedule.current_bookings >= schedule.max_capacity) {
        throw AppError.badRequest(
          'This class is full. Please join the waiting list.',
          { available_spots: 0, waiting_list_available: true }
        );
      }

      // Check for time conflicts with user's other bookings
      const conflicts = await checkBookingConflicts(client, user_id, schedule_id);
      if (conflicts.length > 0) {
        throw AppError.conflict(
          `You have a conflicting booking for "${conflicts[0].class_name}" ` +
          `(${new Date(conflicts[0].start_time).toLocaleTimeString()} - ${new Date(conflicts[0].end_time).toLocaleTimeString()})`
        );
      }

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, schedule_id, status, booking_date)
         VALUES ($1, $2, 'confirmed', NOW())
         RETURNING *`,
        [user_id, schedule_id]
      );

      // Update schedule bookings count
      await client.query(
        'UPDATE schedules SET current_bookings = current_bookings + 1 WHERE id = $1',
        [schedule_id]
      );

      // Get full booking details
      const fullBooking = await client.query(
        `SELECT b.*, s.start_time, s.end_time, s.room,
                c.name as class_name, c.category, c.duration_minutes,
                u.full_name as trainer_name,
                bu.email as user_email, bu.full_name as user_name
         FROM bookings b
         JOIN schedules s ON b.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         JOIN trainers t ON s.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         JOIN users bu ON b.user_id = bu.id
         WHERE b.id = $1`,
        [bookingResult.rows[0].id]
      );

      const booking = fullBooking.rows[0];

      // Prepare email data (in production, send actual email)
      const emailData = prepareBookingConfirmationEmail(booking, {
        email: booking.user_email,
        full_name: booking.user_name,
      });
      console.log('[EMAIL] Booking confirmation prepared:', emailData.subject);

      return { booking, reactivated: false };
    });

    const message = result.reactivated
      ? 'Booking reactivated successfully'
      : 'Booking created successfully';

    return created(res, result.booking, message);
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's bookings (upcoming and past)
 * GET /api/bookings/my-bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type, // 'upcoming' or 'past'
      from,
      to,
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = ['b.user_id = $1'];
    const values = [req.user.id];
    let paramCount = 2;

    if (status) {
      conditions.push(`b.status = $${paramCount++}`);
      values.push(status);
    }

    if (type === 'upcoming') {
      conditions.push('s.start_time > NOW()');
      conditions.push("b.status = 'confirmed'");
    } else if (type === 'past') {
      conditions.push('s.start_time <= NOW()');
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
      `SELECT COUNT(*)
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get bookings with sorting (upcoming first, then by date)
    const result = await query(
      `SELECT b.id, b.user_id, b.schedule_id, b.status, b.booking_date,
              b.cancelled_at, b.cancellation_reason, b.attended, b.rating, b.feedback,
              s.start_time, s.end_time, s.room, s.status as schedule_status,
              c.id as class_id, c.name as class_name, c.category, c.duration_minutes,
              c.difficulty_level,
              t.id as trainer_id, u.full_name as trainer_name,
              CASE WHEN s.start_time > NOW() THEN true ELSE false END as is_upcoming,
              CASE
                WHEN s.start_time > NOW() AND b.status = 'confirmed'
                  AND s.start_time > NOW() + INTERVAL '${CANCELLATION_WINDOW_HOURS} hours'
                THEN true
                ELSE false
              END as can_cancel
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY
         CASE WHEN s.start_time > NOW() THEN 0 ELSE 1 END,
         CASE WHEN s.start_time > NOW() THEN s.start_time END ASC,
         CASE WHEN s.start_time <= NOW() THEN s.start_time END DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    // Add summary stats
    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE b.status = 'confirmed' AND s.start_time > NOW()) as upcoming_count,
         COUNT(*) FILTER (WHERE b.status = 'completed') as completed_count,
         COUNT(*) FILTER (WHERE b.status = 'cancelled') as cancelled_count,
         COUNT(*) FILTER (WHERE b.status = 'no_show') as no_show_count
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       WHERE b.user_id = $1`,
      [req.user.id]
    );

    const response = {
      bookings: result.rows,
      stats: {
        upcoming: parseInt(statsResult.rows[0].upcoming_count, 10),
        completed: parseInt(statsResult.rows[0].completed_count, 10),
        cancelled: parseInt(statsResult.rows[0].cancelled_count, 10),
        no_show: parseInt(statsResult.rows[0].no_show_count, 10),
      },
    };

    return paginated(res, response.bookings, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      stats: response.stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT b.*, s.start_time, s.end_time, s.room, s.status as schedule_status,
              c.id as class_id, c.name as class_name, c.description as class_description,
              c.category, c.duration_minutes, c.difficulty_level, c.equipment_needed,
              t.id as trainer_profile_id, t.specialization, t.rating as trainer_rating,
              u.full_name as trainer_name, u.email as trainer_email,
              CASE WHEN s.start_time > NOW() THEN true ELSE false END as is_upcoming,
              CASE
                WHEN s.start_time > NOW() AND b.status = 'confirmed'
                  AND s.start_time > NOW() + INTERVAL '${CANCELLATION_WINDOW_HOURS} hours'
                THEN true
                ELSE false
              END as can_cancel
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('Booking not found');
    }

    const booking = result.rows[0];

    // Check authorization - only the booking owner or admin can view
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      throw AppError.forbidden('You are not authorized to view this booking');
    }

    return success(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking (with 2-hour policy)
 * DELETE /api/bookings/:id
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body || {};

    const result = await transaction(async (client) => {
      // Get booking with lock
      const bookingResult = await client.query(
        `SELECT b.*, s.start_time, s.end_time, c.name as class_name,
                bu.email as user_email, bu.full_name as user_name
         FROM bookings b
         JOIN schedules s ON b.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         JOIN users bu ON b.user_id = bu.id
         WHERE b.id = $1
         FOR UPDATE`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        throw AppError.notFound('Booking not found');
      }

      const booking = bookingResult.rows[0];

      // Check authorization
      if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
        throw AppError.forbidden('You are not authorized to cancel this booking');
      }

      if (booking.status !== 'confirmed') {
        throw AppError.badRequest(`Cannot cancel a booking with status: ${booking.status}`);
      }

      const now = new Date();
      const startTime = new Date(booking.start_time);
      const hoursUntilClass = (startTime - now) / (1000 * 60 * 60);

      // Check if class has already started
      if (startTime <= now) {
        throw AppError.badRequest('Cannot cancel a class that has already started');
      }

      // Enforce 2-hour cancellation policy (admin can override)
      if (req.user.role !== 'admin' && hoursUntilClass < CANCELLATION_WINDOW_HOURS) {
        throw AppError.badRequest(
          `Cancellations must be made at least ${CANCELLATION_WINDOW_HOURS} hours before the class starts. ` +
          `This class starts in ${hoursUntilClass.toFixed(1)} hours.`
        );
      }

      // Determine if late cancellation (for tracking purposes)
      const isLateCancellation = hoursUntilClass < 24;

      // Cancel booking
      await client.query(
        `UPDATE bookings
         SET status = 'cancelled',
             cancelled_at = NOW(),
             cancellation_reason = $1
         WHERE id = $2`,
        [cancellation_reason || 'Cancelled by user', id]
      );

      // Decrease schedule booking count
      await client.query(
        'UPDATE schedules SET current_bookings = current_bookings - 1 WHERE id = $1',
        [booking.schedule_id]
      );

      // Auto-promote from waiting list
      const promotedUser = await promoteFromWaitingList(client, booking.schedule_id);

      // Log cancellation email (in production, send actual email)
      console.log(`[EMAIL] Booking cancellation confirmation to ${booking.user_email}`);
      console.log(`  Class: ${booking.class_name}`);
      console.log(`  Time: ${booking.start_time}`);
      console.log(`  Late cancellation: ${isLateCancellation}`);

      return {
        booking,
        isLateCancellation,
        promotedUser,
      };
    });

    const response = {
      message: 'Booking cancelled successfully',
      is_late_cancellation: result.isLateCancellation,
    };

    if (result.promotedUser) {
      response.waiting_list_notification = `${result.promotedUser.fullName} has been notified of the available spot`;
    }

    return success(res, response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings for a specific schedule (Admin view)
 * GET /api/bookings/schedule/:scheduleId
 */
const getScheduleBookings = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    // Verify schedule exists
    const scheduleResult = await query(
      `SELECT s.*, c.name as class_name, c.max_capacity,
              u.full_name as trainer_name, t.user_id as trainer_user_id
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE s.id = $1`,
      [scheduleId]
    );

    if (scheduleResult.rows.length === 0) {
      throw AppError.notFound('Schedule not found');
    }

    const schedule = scheduleResult.rows[0];

    // Allow trainers to view their own schedule bookings
    if (req.user.role === 'trainer' && schedule.trainer_user_id !== req.user.id) {
      throw AppError.forbidden('You can only view bookings for your own schedules');
    }

    const offset = (page - 1) * limit;
    const conditions = ['b.schedule_id = $1'];
    const values = [scheduleId];
    let paramCount = 2;

    if (status) {
      conditions.push(`b.status = $${paramCount++}`);
      values.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM bookings b ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get bookings
    const bookingsResult = await query(
      `SELECT b.id, b.status, b.booking_date, b.attended, b.rating, b.feedback,
              b.cancelled_at, b.cancellation_reason,
              u.id as user_id, u.full_name, u.email, u.phone
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ${whereClause}
       ORDER BY b.booking_date ASC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    // Get waiting list
    const waitingListResult = await query(
      `SELECT wl.id, wl.position, wl.notified, wl.notified_at, wl.expires_at, wl.created_at,
              u.id as user_id, u.full_name, u.email, u.phone
       FROM waiting_list wl
       JOIN users u ON wl.user_id = u.id
       WHERE wl.schedule_id = $1
       ORDER BY wl.position ASC`,
      [scheduleId]
    );

    // Get stats
    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'no_show') as no_show,
         COUNT(*) FILTER (WHERE attended = true) as attended
       FROM bookings
       WHERE schedule_id = $1`,
      [scheduleId]
    );

    return success(res, {
      schedule: {
        id: schedule.id,
        class_name: schedule.class_name,
        trainer_name: schedule.trainer_name,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room,
        current_bookings: schedule.current_bookings,
        max_capacity: schedule.max_capacity,
        available_spots: schedule.max_capacity - schedule.current_bookings,
        status: schedule.status,
      },
      bookings: bookingsResult.rows,
      waiting_list: waitingListResult.rows,
      stats: {
        confirmed: parseInt(statsResult.rows[0].confirmed, 10),
        cancelled: parseInt(statsResult.rows[0].cancelled, 10),
        completed: parseInt(statsResult.rows[0].completed, 10),
        no_show: parseInt(statsResult.rows[0].no_show, 10),
        attended: parseInt(statsResult.rows[0].attended, 10),
        waiting_list_count: waitingListResult.rows.length,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rate a completed booking
 * POST /api/bookings/:id/rate
 */
const rateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    const result = await transaction(async (client) => {
      // Get booking
      const bookingResult = await client.query(
        `SELECT b.*, s.start_time, s.trainer_id, c.name as class_name
         FROM bookings b
         JOIN schedules s ON b.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         WHERE b.id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        throw AppError.notFound('Booking not found');
      }

      const booking = bookingResult.rows[0];

      // Check authorization
      if (booking.user_id !== req.user.id) {
        throw AppError.forbidden('You can only rate your own bookings');
      }

      // Check if class has ended
      if (new Date(booking.start_time) > new Date()) {
        throw AppError.badRequest('Cannot rate a class that has not yet occurred');
      }

      // Check booking status
      if (booking.status === 'cancelled') {
        throw AppError.badRequest('Cannot rate a cancelled booking');
      }

      if (booking.rating) {
        throw AppError.conflict('You have already rated this class');
      }

      // Update booking with rating
      await client.query(
        `UPDATE bookings
         SET rating = $1, feedback = $2, status = 'completed'
         WHERE id = $3`,
        [rating, feedback, id]
      );

      // Update trainer rating (weighted average)
      await client.query(
        `UPDATE trainers
         SET rating = ((rating * rating_count) + $1) / (rating_count + 1),
             rating_count = rating_count + 1
         WHERE id = $2`,
        [rating, booking.trainer_id]
      );

      return {
        class_name: booking.class_name,
        rating,
        feedback,
      };
    });

    return success(res, result, 'Rating submitted successfully. Thank you for your feedback!');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings (Admin only)
 * GET /api/bookings
 */
const getAllBookings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      schedule_id,
      class_id,
      trainer_id,
      from,
      to,
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

    if (schedule_id) {
      conditions.push(`b.schedule_id = $${paramCount++}`);
      values.push(schedule_id);
    }

    if (class_id) {
      conditions.push(`s.class_id = $${paramCount++}`);
      values.push(class_id);
    }

    if (trainer_id) {
      conditions.push(`s.trainer_id = $${paramCount++}`);
      values.push(trainer_id);
    }

    if (from) {
      conditions.push(`s.start_time >= $${paramCount++}`);
      values.push(from);
    }

    if (to) {
      conditions.push(`s.start_time <= $${paramCount++}`);
      values.push(to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['booking_date', 'start_time', 'status', 'rating'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'booking_date';
    const sortOrderClean = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const sortMapping = {
      booking_date: 'b.booking_date',
      start_time: 's.start_time',
      status: 'b.status',
      rating: 'b.rating',
    };

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
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
              bu.full_name as user_name, bu.email as user_email, bu.phone as user_phone,
              tu.full_name as trainer_name
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
 * Mark attendance (Admin/Trainer)
 * PATCH /api/bookings/:id/attendance
 */
const markAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attended } = req.body;

    // Get booking to check trainer authorization
    const bookingCheck = await query(
      `SELECT b.*, s.trainer_id, t.user_id as trainer_user_id
       FROM bookings b
       JOIN schedules s ON b.schedule_id = s.id
       JOIN trainers t ON s.trainer_id = t.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      throw AppError.notFound('Booking not found');
    }

    const booking = bookingCheck.rows[0];

    // Allow trainers to mark attendance only for their own classes
    if (req.user.role === 'trainer' && booking.trainer_user_id !== req.user.id) {
      throw AppError.forbidden('You can only mark attendance for your own classes');
    }

    // Update attendance
    const newStatus = attended === false ? 'no_show' : (booking.status === 'confirmed' ? 'completed' : booking.status);

    const result = await query(
      `UPDATE bookings
       SET attended = $1, status = $2
       WHERE id = $3
       RETURNING *`,
      [attended, newStatus, id]
    );

    return success(res, result.rows[0], `Attendance marked as ${attended ? 'present' : 'no-show'}`);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// WAITING LIST METHODS
// ==========================================

/**
 * Join waiting list
 * POST /api/waiting-list
 */
const joinWaitingList = async (req, res, next) => {
  try {
    const { schedule_id } = req.body;
    const user_id = req.user.id;

    const result = await transaction(async (client) => {
      // Get schedule with lock
      const scheduleResult = await client.query(
        `SELECT s.*, c.max_capacity, c.name as class_name
         FROM schedules s
         JOIN classes c ON s.class_id = c.id
         WHERE s.id = $1
         FOR UPDATE`,
        [schedule_id]
      );

      if (scheduleResult.rows.length === 0) {
        throw AppError.notFound('Schedule not found');
      }

      const schedule = scheduleResult.rows[0];

      if (schedule.status !== 'active') {
        throw AppError.badRequest('This schedule is not available');
      }

      if (new Date(schedule.start_time) <= new Date()) {
        throw AppError.badRequest('Cannot join waiting list for a past class');
      }

      // Check if class actually needs a waiting list
      if (schedule.current_bookings < schedule.max_capacity) {
        throw AppError.badRequest(
          'This class has available spots. Please book directly instead of joining the waiting list.'
        );
      }

      // Check for existing confirmed booking
      const existingBooking = await client.query(
        `SELECT id FROM bookings WHERE user_id = $1 AND schedule_id = $2 AND status = 'confirmed'`,
        [user_id, schedule_id]
      );

      if (existingBooking.rows.length > 0) {
        throw AppError.conflict('You already have a confirmed booking for this class');
      }

      // Check if already on waiting list
      const existingWaiting = await client.query(
        'SELECT id, position FROM waiting_list WHERE user_id = $1 AND schedule_id = $2',
        [user_id, schedule_id]
      );

      if (existingWaiting.rows.length > 0) {
        throw AppError.conflict(
          `You are already on the waiting list at position ${existingWaiting.rows[0].position}`
        );
      }

      // Get next position
      const positionResult = await client.query(
        'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM waiting_list WHERE schedule_id = $1',
        [schedule_id]
      );

      const nextPosition = positionResult.rows[0].next_position;

      // Add to waiting list
      const waitingResult = await client.query(
        `INSERT INTO waiting_list (user_id, schedule_id, position)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user_id, schedule_id, nextPosition]
      );

      // Get full entry details
      const fullEntry = await client.query(
        `SELECT wl.*, s.start_time, s.end_time, c.name as class_name,
                u.full_name as trainer_name
         FROM waiting_list wl
         JOIN schedules s ON wl.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         JOIN trainers t ON s.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE wl.id = $1`,
        [waitingResult.rows[0].id]
      );

      return fullEntry.rows[0];
    });

    return created(res, result, `Added to waiting list at position ${result.position}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Leave waiting list
 * DELETE /api/waiting-list/:id
 */
const leaveWaitingList = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await transaction(async (client) => {
      // Get waiting list entry with lock
      const waitingResult = await client.query(
        `SELECT wl.*, c.name as class_name
         FROM waiting_list wl
         JOIN schedules s ON wl.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         WHERE wl.id = $1
         FOR UPDATE`,
        [id]
      );

      if (waitingResult.rows.length === 0) {
        throw AppError.notFound('Waiting list entry not found');
      }

      const waitingEntry = waitingResult.rows[0];

      // Check authorization
      if (req.user.role !== 'admin' && waitingEntry.user_id !== req.user.id) {
        throw AppError.forbidden('You are not authorized to remove this entry');
      }

      // Remove from waiting list
      await client.query('DELETE FROM waiting_list WHERE id = $1', [id]);

      // Update positions for others in the queue
      await client.query(
        `UPDATE waiting_list
         SET position = position - 1
         WHERE schedule_id = $1 AND position > $2`,
        [waitingEntry.schedule_id, waitingEntry.position]
      );

      return waitingEntry;
    });

    return success(res, {
      message: 'Removed from waiting list',
      class_name: result.class_name,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's waiting list entries
 * GET /api/waiting-list/my-list
 */
const getMyWaitingList = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT wl.id, wl.schedule_id, wl.position, wl.notified, wl.notified_at,
              wl.expires_at, wl.created_at,
              s.start_time, s.end_time, s.room, s.current_bookings,
              c.name as class_name, c.category, c.duration_minutes, c.max_capacity,
              u.full_name as trainer_name,
              (c.max_capacity - s.current_bookings) as spots_available,
              CASE
                WHEN wl.notified = true AND wl.expires_at > NOW()
                THEN true ELSE false
              END as can_confirm,
              CASE
                WHEN wl.notified = true AND wl.expires_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (wl.expires_at - NOW())) / 3600
                ELSE NULL
              END as hours_to_confirm
       FROM waiting_list wl
       JOIN schedules s ON wl.schedule_id = s.id
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE wl.user_id = $1 AND s.start_time > NOW() AND s.status = 'active'
       ORDER BY s.start_time ASC`,
      [req.user.id]
    );

    return success(res, result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm booking from waiting list
 * POST /api/waiting-list/:id/confirm
 */
const confirmFromWaitingList = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await transaction(async (client) => {
      // Get waiting list entry with lock
      const waitingResult = await client.query(
        `SELECT wl.*, s.start_time, s.current_bookings, c.max_capacity, c.name as class_name
         FROM waiting_list wl
         JOIN schedules s ON wl.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         WHERE wl.id = $1
         FOR UPDATE`,
        [id]
      );

      if (waitingResult.rows.length === 0) {
        throw AppError.notFound('Waiting list entry not found');
      }

      const waitingEntry = waitingResult.rows[0];

      // Check authorization
      if (waitingEntry.user_id !== req.user.id) {
        throw AppError.forbidden('This is not your waiting list entry');
      }

      // Check if notified
      if (!waitingEntry.notified) {
        throw AppError.badRequest(
          'You have not been notified yet. Please wait for a spot to become available.'
        );
      }

      // Check if expired
      if (waitingEntry.expires_at && new Date(waitingEntry.expires_at) < new Date()) {
        // Remove expired entry
        await client.query('DELETE FROM waiting_list WHERE id = $1', [id]);
        throw AppError.badRequest(
          'Your waiting list notification has expired. You have been removed from the list.'
        );
      }

      // Check if class is in the future
      if (new Date(waitingEntry.start_time) <= new Date()) {
        throw AppError.badRequest('This class has already started');
      }

      // Check if there's actually a spot (should be, but verify)
      if (waitingEntry.current_bookings >= waitingEntry.max_capacity) {
        throw AppError.badRequest('Sorry, the spot is no longer available');
      }

      // Check for time conflicts
      const conflicts = await checkBookingConflicts(client, waitingEntry.user_id, waitingEntry.schedule_id);
      if (conflicts.length > 0) {
        throw AppError.conflict(
          `You have a conflicting booking for "${conflicts[0].class_name}" at that time`
        );
      }

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, schedule_id, status, booking_date)
         VALUES ($1, $2, 'confirmed', NOW())
         RETURNING *`,
        [waitingEntry.user_id, waitingEntry.schedule_id]
      );

      // Update schedule bookings count
      await client.query(
        'UPDATE schedules SET current_bookings = current_bookings + 1 WHERE id = $1',
        [waitingEntry.schedule_id]
      );

      // Remove from waiting list
      await client.query('DELETE FROM waiting_list WHERE id = $1', [id]);

      // Update positions for others
      await client.query(
        `UPDATE waiting_list
         SET position = position - 1
         WHERE schedule_id = $1 AND position > $2`,
        [waitingEntry.schedule_id, waitingEntry.position]
      );

      // Get full booking details
      const fullBooking = await client.query(
        `SELECT b.*, s.start_time, s.end_time, s.room,
                c.name as class_name, c.category,
                u.full_name as trainer_name
         FROM bookings b
         JOIN schedules s ON b.schedule_id = s.id
         JOIN classes c ON s.class_id = c.id
         JOIN trainers t ON s.trainer_id = t.id
         JOIN users u ON t.user_id = u.id
         WHERE b.id = $1`,
        [bookingResult.rows[0].id]
      );

      return fullBooking.rows[0];
    });

    return created(res, result, 'Booking confirmed from waiting list!');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getScheduleBookings,
  rateBooking,
  getAllBookings,
  markAttendance,
  joinWaitingList,
  leaveWaitingList,
  getMyWaitingList,
  confirmFromWaitingList,
};
