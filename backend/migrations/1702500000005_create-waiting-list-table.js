exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create waiting_list table
  pgm.createTable('waiting_list', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    schedule_id: {
      type: 'uuid',
      notNull: true,
      references: 'schedules(id)',
      onDelete: 'CASCADE',
    },
    position: {
      type: 'integer',
      notNull: true,
      check: 'position > 0',
    },
    notified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    notified_at: {
      type: 'timestamp with time zone',
    },
    expires_at: {
      type: 'timestamp with time zone',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add unique constraint - a user can only be on waiting list once per schedule
  pgm.addConstraint('waiting_list', 'waiting_list_user_schedule_unique', {
    unique: ['user_id', 'schedule_id'],
  });

  // Add unique constraint for position within a schedule
  pgm.addConstraint('waiting_list', 'waiting_list_schedule_position_unique', {
    unique: ['schedule_id', 'position'],
  });

  // Create indexes
  pgm.createIndex('waiting_list', 'user_id');
  pgm.createIndex('waiting_list', 'schedule_id');
  pgm.createIndex('waiting_list', ['schedule_id', 'position'], {
    name: 'idx_waiting_list_schedule_position',
  });
  pgm.createIndex('waiting_list', 'created_at');

  // Function to auto-promote from waiting list when booking is cancelled
  pgm.sql(`
    CREATE OR REPLACE FUNCTION promote_from_waiting_list()
    RETURNS TRIGGER AS $$
    DECLARE
      next_in_line RECORD;
      schedule_max_capacity INTEGER;
      schedule_current_bookings INTEGER;
    BEGIN
      -- Only trigger when booking is cancelled
      IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
        -- Get schedule capacity
        SELECT c.max_capacity, s.current_bookings
        INTO schedule_max_capacity, schedule_current_bookings
        FROM schedules s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = NEW.schedule_id;

        -- Check if there's room and someone on waiting list
        IF schedule_current_bookings <= schedule_max_capacity THEN
          -- Get first person on waiting list
          SELECT * INTO next_in_line
          FROM waiting_list
          WHERE schedule_id = NEW.schedule_id
          ORDER BY position ASC
          LIMIT 1;

          IF next_in_line.id IS NOT NULL THEN
            -- Mark as notified (in real app, would trigger notification)
            UPDATE waiting_list
            SET notified = true,
                notified_at = CURRENT_TIMESTAMP,
                expires_at = CURRENT_TIMESTAMP + INTERVAL '2 hours'
            WHERE id = next_in_line.id;
          END IF;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER booking_cancellation_trigger
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION promote_from_waiting_list();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS booking_cancellation_trigger ON bookings;');
  pgm.sql('DROP FUNCTION IF EXISTS promote_from_waiting_list();');
  pgm.dropTable('waiting_list');
};
