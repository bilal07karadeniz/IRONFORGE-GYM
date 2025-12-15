exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create trainers table
  pgm.createTable('trainers', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    specialization: {
      type: 'varchar(255)',
      notNull: true,
    },
    bio: {
      type: 'text',
    },
    years_experience: {
      type: 'integer',
      notNull: true,
      default: 0,
      check: 'years_experience >= 0',
    },
    rating: {
      type: 'decimal(3,2)',
      default: 0.00,
      check: 'rating >= 0 AND rating <= 5',
    },
    rating_count: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    hourly_rate: {
      type: 'decimal(10,2)',
    },
    is_available: {
      type: 'boolean',
      notNull: true,
      default: true,
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

  // Create indexes
  pgm.createIndex('trainers', 'user_id');
  pgm.createIndex('trainers', 'specialization');
  pgm.createIndex('trainers', 'rating');
  pgm.createIndex('trainers', 'is_available');

  // Create trigger for updating updated_at
  pgm.sql(`
    CREATE TRIGGER update_trainers_updated_at
    BEFORE UPDATE ON trainers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('trainers', 'update_trainers_updated_at', { ifExists: true });
  pgm.dropTable('trainers');
};
