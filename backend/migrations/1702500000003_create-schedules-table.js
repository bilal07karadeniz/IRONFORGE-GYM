exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create enum for schedule status
  pgm.createType('schedule_status', ['active', 'cancelled', 'completed']);

  // Create schedules table
  pgm.createTable('schedules', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    class_id: {
      type: 'uuid',
      notNull: true,
      references: 'classes(id)',
      onDelete: 'CASCADE',
    },
    trainer_id: {
      type: 'uuid',
      notNull: true,
      references: 'trainers(id)',
      onDelete: 'CASCADE',
    },
    start_time: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    end_time: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    current_bookings: {
      type: 'integer',
      notNull: true,
      default: 0,
      check: 'current_bookings >= 0',
    },
    status: {
      type: 'schedule_status',
      notNull: true,
      default: 'active',
    },
    room: {
      type: 'varchar(100)',
    },
    notes: {
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

  // Add constraint for end_time > start_time
  pgm.addConstraint('schedules', 'schedules_time_check', {
    check: 'end_time > start_time',
  });

  // Create indexes
  pgm.createIndex('schedules', 'class_id');
  pgm.createIndex('schedules', 'trainer_id');
  pgm.createIndex('schedules', 'start_time');
  pgm.createIndex('schedules', 'status');
  pgm.createIndex('schedules', ['start_time', 'status'], {
    name: 'idx_schedules_start_time_status',
  });
  pgm.createIndex('schedules', ['trainer_id', 'start_time'], {
    name: 'idx_schedules_trainer_time',
  });

  // Create trigger for updating updated_at
  pgm.sql(`
    CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('schedules', 'update_schedules_updated_at', { ifExists: true });
  pgm.dropTable('schedules');
  pgm.dropType('schedule_status');
};
