exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create enum for booking status
  pgm.createType('booking_status', ['confirmed', 'cancelled', 'completed', 'no_show']);

  // Create bookings table
  pgm.createTable('bookings', {
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
    status: {
      type: 'booking_status',
      notNull: true,
      default: 'confirmed',
    },
    booking_date: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    cancelled_at: {
      type: 'timestamp with time zone',
    },
    cancellation_reason: {
      type: 'text',
    },
    attended: {
      type: 'boolean',
    },
    rating: {
      type: 'integer',
      check: 'rating >= 1 AND rating <= 5',
    },
    feedback: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Add unique constraint - a user can only book a schedule once
  pgm.addConstraint('bookings', 'bookings_user_schedule_unique', {
    unique: ['user_id', 'schedule_id'],
  });

  // Create indexes
  pgm.createIndex('bookings', 'user_id');
  pgm.createIndex('bookings', 'schedule_id');
  pgm.createIndex('bookings', 'status');
  pgm.createIndex('bookings', 'booking_date');
  pgm.createIndex('bookings', ['user_id', 'status'], {
    name: 'idx_bookings_user_status',
  });
  pgm.createIndex('bookings', ['schedule_id', 'status'], {
    name: 'idx_bookings_schedule_status',
  });

  // Create trigger for updating updated_at
  pgm.sql(`
    CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('bookings', 'update_bookings_updated_at', { ifExists: true });
  pgm.dropTable('bookings');
  pgm.dropType('booking_status');
};
