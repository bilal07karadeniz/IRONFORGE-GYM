const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { success, created, paginated } = require('../utils/response');

/**
 * Create a new schedule
 * POST /api/schedules
 */
const createSchedule = async (req, res, next) => {
  try {
    const { class_id, trainer_id, start_time, end_time, room, notes } = req.body;

    // Validate start_time is in the future
    if (new Date(start_time) <= new Date()) {
      throw AppError.badRequest('Start time must be in the future');
    }

    // Validate end_time is after start_time
    if (new Date(end_time) <= new Date(start_time)) {
      throw AppError.badRequest('End time must be after start time');
    }

    // Verify class exists and is active
    const classResult = await query(
      'SELECT id, name, duration_minutes, max_capacity FROM classes WHERE id = $1 AND is_active = true',
      [class_id]
    );
    if (classResult.rows.length === 0) {
      throw AppError.notFound('Class not found or is inactive');
    }

    // Verify trainer exists and is available
    const trainerResult = await query(
      `SELECT t.id, t.is_available, t.user_id, u.full_name
       FROM trainers t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [trainer_id]
    );
    if (trainerResult.rows.length === 0) {
      throw AppError.notFound('Trainer not found');
    }

    if (!trainerResult.rows[0].is_available) {
      throw AppError.badRequest('Trainer is currently not available for scheduling');
    }

    // Check if requesting user is the trainer (if trainer role)
    if (req.user.role === 'trainer') {
      const userTrainer = await query(
        'SELECT id FROM trainers WHERE user_id = $1',
        [req.user.id]
      );
      if (userTrainer.rows.length === 0 || userTrainer.rows[0].id !== trainer_id) {
        throw AppError.forbidden('Trainers can only create schedules for themselves');
      }
    }

    // Check for trainer scheduling conflicts (overlapping times)
    const conflictResult = await query(
      `SELECT s.id, s.start_time, s.end_time, c.name as class_name
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       WHERE s.trainer_id = $1 AND s.status = 'active'
       AND (
         (s.start_time < $3 AND s.end_time > $2)
       )`,
      [trainer_id, start_time, end_time]
    );

    if (conflictResult.rows.length > 0) {
      const conflict = conflictResult.rows[0];
      throw AppError.conflict(
        `Trainer has a scheduling conflict with "${conflict.class_name}" ` +
        `(${new Date(conflict.start_time).toISOString()} - ${new Date(conflict.end_time).toISOString()})`
      );
    }

    // Check for room conflicts if room is specified
    if (room) {
      const roomConflict = await query(
        `SELECT s.id, s.start_time, s.end_time, c.name as class_name
         FROM schedules s
         JOIN classes c ON s.class_id = c.id
         WHERE s.room = $1 AND s.status = 'active'
         AND (
           (s.start_time < $3 AND s.end_time > $2)
         )`,
        [room, start_time, end_time]
      );

      if (roomConflict.rows.length > 0) {
        const conflict = roomConflict.rows[0];
        throw AppError.conflict(
          `Room "${room}" is already booked for "${conflict.class_name}" during this time`
        );
      }
    }

    const result = await query(
      `INSERT INTO schedules (class_id, trainer_id, start_time, end_time, room, notes, current_bookings)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING *`,
      [class_id, trainer_id, start_time, end_time, room, notes]
    );

    // Fetch full schedule details
    const fullSchedule = await query(
      `SELECT s.*,
              c.name as class_name, c.category, c.max_capacity,
              u.full_name as trainer_name
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE s.id = $1`,
      [result.rows[0].id]
    );

    return created(res, fullSchedule.rows[0], 'Schedule created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all schedules with filters
 * GET /api/schedules
 */
const getAllSchedules = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      class_id,
      trainer_id,
      category,
      status = 'active',
      from,
      to,
      date,
      upcoming = 'true',
      sort_by = 'start_time',
      sort_order = 'asc',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (class_id) {
      conditions.push(`s.class_id = $${paramCount++}`);
      values.push(class_id);
    }

    if (trainer_id) {
      conditions.push(`s.trainer_id = $${paramCount++}`);
      values.push(trainer_id);
    }

    if (category) {
      conditions.push(`c.category = $${paramCount++}`);
      values.push(category);
    }

    if (status) {
      conditions.push(`s.status = $${paramCount++}`);
      values.push(status);
    }

    if (date) {
      // Filter by specific date
      conditions.push(`DATE(s.start_time) = $${paramCount++}`);
      values.push(date);
    } else {
      if (from) {
        conditions.push(`s.start_time >= $${paramCount++}`);
        values.push(from);
      } else if (upcoming === 'true') {
        conditions.push('s.start_time > NOW()');
      }

      if (to) {
        conditions.push(`s.start_time <= $${paramCount++}`);
        values.push(to);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['start_time', 'class_name', 'trainer_name', 'current_bookings', 'created_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'start_time';
    const sortOrderClean = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Map sort column to actual table column
    const sortMapping = {
      start_time: 's.start_time',
      class_name: 'c.name',
      trainer_name: 'u.full_name',
      current_bookings: 's.current_bookings',
      created_at: 's.created_at',
    };

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get schedules with class and trainer info
    const result = await query(
      `SELECT s.id, s.class_id, s.trainer_id, s.start_time, s.end_time,
              s.current_bookings, s.status, s.room, s.notes, s.created_at,
              c.name as class_name, c.category, c.max_capacity, c.duration_minutes,
              c.difficulty_level, c.description as class_description,
              t.id as trainer_profile_id, t.rating as trainer_rating,
              u.full_name as trainer_name,
              (c.max_capacity - s.current_bookings) as available_spots,
              CASE WHEN c.max_capacity <= s.current_bookings THEN true ELSE false END as is_full
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY ${sortMapping[sortColumn]} ${sortOrderClean}
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available schedules for booking
 * GET /api/schedules/available
 */
const getAvailableSchedules = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      class_id,
      trainer_id,
      category,
      from,
      to,
      date,
      days_ahead = 14,
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [
      's.status = $1',
      's.start_time > NOW()',
      'c.max_capacity > s.current_bookings',
    ];
    const values = ['active'];
    let paramCount = 2;

    if (class_id) {
      conditions.push(`s.class_id = $${paramCount++}`);
      values.push(class_id);
    }

    if (trainer_id) {
      conditions.push(`s.trainer_id = $${paramCount++}`);
      values.push(trainer_id);
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
      } else {
        // Default to next N days
        conditions.push(`s.start_time <= NOW() + INTERVAL '${parseInt(days_ahead)} days'`);
      }
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*)
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // Get available schedules
    const result = await query(
      `SELECT s.id, s.class_id, s.trainer_id, s.start_time, s.end_time,
              s.current_bookings, s.room,
              c.name as class_name, c.category, c.max_capacity, c.duration_minutes,
              c.difficulty_level,
              u.full_name as trainer_name, t.rating as trainer_rating,
              (c.max_capacity - s.current_bookings) as available_spots
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY s.start_time ASC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

/**
 * Get schedule by ID with full details
 * GET /api/schedules/:id
 */
const getScheduleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT s.*,
              c.name as class_name, c.description as class_description, c.category,
              c.max_capacity, c.duration_minutes, c.difficulty_level, c.equipment_needed,
              t.id as trainer_profile_id, t.specialization, t.rating as trainer_rating,
              t.bio as trainer_bio,
              u.full_name as trainer_name, u.email as trainer_email,
              (c.max_capacity - s.current_bookings) as available_spots,
              CASE WHEN c.max_capacity <= s.current_bookings THEN true ELSE false END as is_full
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw AppError.notFound('Schedule not found');
    }

    // Get booking count by status
    const bookingStats = await query(
      `SELECT status, COUNT(*) as count
       FROM bookings
       WHERE schedule_id = $1
       GROUP BY status`,
      [id]
    );

    // Get waiting list count
    const waitingListResult = await query(
      'SELECT COUNT(*) FROM waiting_list WHERE schedule_id = $1',
      [id]
    );

    const schedule = result.rows[0];
    schedule.booking_stats = bookingStats.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {});
    schedule.waiting_list_count = parseInt(waitingListResult.rows[0].count, 10);

    return success(res, schedule);
  } catch (error) {
    next(error);
  }
};

/**
 * Update schedule
 * PUT /api/schedules/:id
 */
const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, status, room, notes, trainer_id } = req.body;

    const result = await transaction(async (client) => {
      // Check if schedule exists and get current data
      const existingSchedule = await client.query(
        `SELECT s.*, c.name as class_name
         FROM schedules s
         JOIN classes c ON s.class_id = c.id
         WHERE s.id = $1`,
        [id]
      );

      if (existingSchedule.rows.length === 0) {
        throw AppError.notFound('Schedule not found');
      }

      const currentSchedule = existingSchedule.rows[0];

      // Check if trainer can only update their own schedules
      if (req.user.role === 'trainer') {
        const userTrainer = await client.query(
          'SELECT id FROM trainers WHERE user_id = $1',
          [req.user.id]
        );
        if (userTrainer.rows.length === 0 || userTrainer.rows[0].id !== currentSchedule.trainer_id) {
          throw AppError.forbidden('Trainers can only update their own schedules');
        }
      }

      const newStart = start_time ? new Date(start_time) : new Date(currentSchedule.start_time);
      const newEnd = end_time ? new Date(end_time) : new Date(currentSchedule.end_time);
      const newTrainerId = trainer_id || currentSchedule.trainer_id;

      // Validate times if being changed
      if (start_time || end_time) {
        if (newEnd <= newStart) {
          throw AppError.badRequest('End time must be after start time');
        }

        // Only allow future dates for time changes
        if (newStart <= new Date()) {
          throw AppError.badRequest('Cannot change schedule to a past time');
        }
      }

      // Check for conflicts if time or trainer is being changed
      if (start_time || end_time || trainer_id) {
        const conflictResult = await client.query(
          `SELECT s.id, s.start_time, s.end_time, c.name as class_name
           FROM schedules s
           JOIN classes c ON s.class_id = c.id
           WHERE s.trainer_id = $1 AND s.id != $2 AND s.status = 'active'
           AND (s.start_time < $4 AND s.end_time > $3)`,
          [newTrainerId, id, newStart, newEnd]
        );

        if (conflictResult.rows.length > 0) {
          const conflict = conflictResult.rows[0];
          throw AppError.conflict(
            `This change would create a conflict with "${conflict.class_name}"`
          );
        }
      }

      // Check room conflict if room is being changed
      if (room && room !== currentSchedule.room) {
        const roomConflict = await client.query(
          `SELECT s.id, c.name as class_name
           FROM schedules s
           JOIN classes c ON s.class_id = c.id
           WHERE s.room = $1 AND s.id != $2 AND s.status = 'active'
           AND (s.start_time < $4 AND s.end_time > $3)`,
          [room, id, newStart, newEnd]
        );

        if (roomConflict.rows.length > 0) {
          throw AppError.conflict(`Room "${room}" is already booked during this time`);
        }
      }

      // Build update query
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (start_time !== undefined) {
        updates.push(`start_time = $${paramCount++}`);
        values.push(start_time);
      }

      if (end_time !== undefined) {
        updates.push(`end_time = $${paramCount++}`);
        values.push(end_time);
      }

      if (trainer_id !== undefined) {
        updates.push(`trainer_id = $${paramCount++}`);
        values.push(trainer_id);
      }

      if (status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(status);
      }

      if (room !== undefined) {
        updates.push(`room = $${paramCount++}`);
        values.push(room);
      }

      if (notes !== undefined) {
        updates.push(`notes = $${paramCount++}`);
        values.push(notes);
      }

      if (updates.length === 0) {
        throw AppError.badRequest('No fields to update');
      }

      values.push(id);

      const updateResult = await client.query(
        `UPDATE schedules SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      // If time was changed and there are bookings, log it (in production, send notifications)
      if ((start_time || end_time) && currentSchedule.current_bookings > 0) {
        console.log(`Schedule ${id} time changed. ${currentSchedule.current_bookings} users should be notified.`);
        // In production: Send notifications to booked users about time change
      }

      // If status changed to cancelled, cascade to bookings
      if (status === 'cancelled' && currentSchedule.status !== 'cancelled') {
        await client.query(
          `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(),
           cancellation_reason = 'Schedule was cancelled by admin'
           WHERE schedule_id = $1 AND status = 'confirmed'`,
          [id]
        );

        await client.query('DELETE FROM waiting_list WHERE schedule_id = $1', [id]);
      }

      return updateResult.rows[0];
    });

    // Fetch full updated schedule
    const fullSchedule = await query(
      `SELECT s.*,
              c.name as class_name, c.category, c.max_capacity,
              u.full_name as trainer_name,
              (c.max_capacity - s.current_bookings) as available_spots
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       JOIN trainers t ON s.trainer_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE s.id = $1`,
      [result.id]
    );

    return success(res, fullSchedule.rows[0], 'Schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel schedule (with user notification)
 * DELETE /api/schedules/:id or POST /api/schedules/:id/cancel
 */
const cancelSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const result = await transaction(async (client) => {
      // Get schedule with booking info
      const scheduleResult = await client.query(
        `SELECT s.*, c.name as class_name
         FROM schedules s
         JOIN classes c ON s.class_id = c.id
         WHERE s.id = $1`,
        [id]
      );

      if (scheduleResult.rows.length === 0) {
        throw AppError.notFound('Schedule not found');
      }

      const schedule = scheduleResult.rows[0];

      if (schedule.status === 'cancelled') {
        throw AppError.badRequest('Schedule is already cancelled');
      }

      // Check if trainer can only cancel their own schedules
      if (req.user.role === 'trainer') {
        const userTrainer = await client.query(
          'SELECT id FROM trainers WHERE user_id = $1',
          [req.user.id]
        );
        if (userTrainer.rows.length === 0 || userTrainer.rows[0].id !== schedule.trainer_id) {
          throw AppError.forbidden('Trainers can only cancel their own schedules');
        }
      }

      // Update schedule status
      await client.query(
        `UPDATE schedules SET status = 'cancelled'
         WHERE id = $1`,
        [id]
      );

      // Get affected bookings for notification
      const affectedBookings = await client.query(
        `SELECT b.id, b.user_id, u.email, u.full_name
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         WHERE b.schedule_id = $1 AND b.status = 'confirmed'`,
        [id]
      );

      // Cancel all bookings for this schedule
      const cancellationReason = reason || 'Schedule was cancelled';
      await client.query(
        `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(),
         cancellation_reason = $1
         WHERE schedule_id = $2 AND status = 'confirmed'`,
        [cancellationReason, id]
      );

      // Clear waiting list
      await client.query('DELETE FROM waiting_list WHERE schedule_id = $1', [id]);

      // Log notification info (in production, send actual notifications)
      if (affectedBookings.rows.length > 0) {
        console.log(`Schedule "${schedule.class_name}" cancelled. Notifying ${affectedBookings.rows.length} users:`);
        affectedBookings.rows.forEach(booking => {
          console.log(`  - ${booking.full_name} (${booking.email})`);
        });
      }

      return {
        schedule,
        affected_users: affectedBookings.rows.length,
      };
    });

    return success(res, {
      message: 'Schedule cancelled successfully',
      affected_bookings: result.affected_users,
    }, `Schedule cancelled. ${result.affected_users} booking(s) have been cancelled.`);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete schedule (only if no bookings)
 * This is a hard delete, use cancel for soft delete
 */
const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if schedule exists
    const scheduleResult = await query(
      'SELECT s.*, t.user_id as trainer_user_id FROM schedules s JOIN trainers t ON s.trainer_id = t.id WHERE s.id = $1',
      [id]
    );

    if (scheduleResult.rows.length === 0) {
      throw AppError.notFound('Schedule not found');
    }

    const schedule = scheduleResult.rows[0];

    // Check if trainer can only delete their own schedules
    if (req.user.role === 'trainer' && schedule.trainer_user_id !== req.user.id) {
      throw AppError.forbidden('Trainers can only delete their own schedules');
    }

    // Check for existing bookings
    const bookingsResult = await query(
      `SELECT COUNT(*) FROM bookings WHERE schedule_id = $1`,
      [id]
    );

    if (parseInt(bookingsResult.rows[0].count, 10) > 0) {
      throw AppError.conflict(
        'Cannot delete schedule with existing bookings. Use cancel endpoint instead to notify users.'
      );
    }

    // Delete waiting list entries first
    await query('DELETE FROM waiting_list WHERE schedule_id = $1', [id]);

    // Delete schedule
    await query('DELETE FROM schedules WHERE id = $1', [id]);

    return success(res, null, 'Schedule deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get schedule attendees
 * GET /api/schedules/:id/attendees
 */
const getScheduleAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Verify schedule exists
    const scheduleResult = await query(
      'SELECT s.id, s.trainer_id, t.user_id as trainer_user_id FROM schedules s JOIN trainers t ON s.trainer_id = t.id WHERE s.id = $1',
      [id]
    );
    if (scheduleResult.rows.length === 0) {
      throw AppError.notFound('Schedule not found');
    }

    // Check if trainer can only view their own schedule attendees
    if (req.user.role === 'trainer' && scheduleResult.rows[0].trainer_user_id !== req.user.id) {
      throw AppError.forbidden('Trainers can only view attendees for their own schedules');
    }

    let attendeesQuery = `
      SELECT b.id as booking_id, b.status, b.booking_date, b.attended,
             b.rating, b.feedback, b.cancelled_at, b.cancellation_reason,
             u.id as user_id, u.full_name, u.email, u.phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.schedule_id = $1
    `;
    const values = [id];

    if (status) {
      attendeesQuery += ' AND b.status = $2';
      values.push(status);
    }

    attendeesQuery += ' ORDER BY b.booking_date ASC';

    const result = await query(attendeesQuery, values);

    // Get waiting list
    const waitingList = await query(
      `SELECT wl.id, wl.position, wl.notified, wl.created_at,
              u.id as user_id, u.full_name, u.email, u.phone
       FROM waiting_list wl
       JOIN users u ON wl.user_id = u.id
       WHERE wl.schedule_id = $1
       ORDER BY wl.position ASC`,
      [id]
    );

    return success(res, {
      attendees: result.rows,
      waiting_list: waitingList.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get trainer's own schedules
 * GET /api/schedules/my (for trainers)
 */
const getMySchedules = async (req, res, next) => {
  try {
    // Get trainer ID for current user
    const trainerResult = await query(
      'SELECT id FROM trainers WHERE user_id = $1',
      [req.user.id]
    );

    if (trainerResult.rows.length === 0) {
      throw AppError.badRequest('You are not registered as a trainer');
    }

    const trainerId = trainerResult.rows[0].id;

    const {
      page = 1,
      limit = 20,
      status,
      from,
      to,
      upcoming = 'true',
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [`s.trainer_id = $1`];
    const values = [trainerId];
    let paramCount = 2;

    if (status) {
      conditions.push(`s.status = $${paramCount++}`);
      values.push(status);
    }

    if (from) {
      conditions.push(`s.start_time >= $${paramCount++}`);
      values.push(from);
    } else if (upcoming === 'true') {
      conditions.push('s.start_time > NOW()');
    }

    if (to) {
      conditions.push(`s.start_time <= $${paramCount++}`);
      values.push(to);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) FROM schedules s ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT s.*,
              c.name as class_name, c.category, c.max_capacity,
              (c.max_capacity - s.current_bookings) as available_spots
       FROM schedules s
       JOIN classes c ON s.class_id = c.id
       ${whereClause}
       ORDER BY s.start_time ASC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      [...values, limit, offset]
    );

    return paginated(res, result.rows, { page: parseInt(page), limit: parseInt(limit), total });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSchedule,
  getAllSchedules,
  getAvailableSchedules,
  getScheduleById,
  updateSchedule,
  cancelSchedule,
  deleteSchedule,
  getScheduleAttendees,
  getMySchedules,
};
