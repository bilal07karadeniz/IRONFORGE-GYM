exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create enum for class categories
  pgm.createType('class_category', ['yoga', 'cardio', 'strength', 'pilates', 'spinning', 'boxing', 'dance', 'swimming', 'crossfit', 'other']);

  // Create classes table
  pgm.createTable('classes', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    duration_minutes: {
      type: 'integer',
      notNull: true,
      check: 'duration_minutes > 0 AND duration_minutes <= 240',
    },
    max_capacity: {
      type: 'integer',
      notNull: true,
      check: 'max_capacity > 0',
    },
    trainer_id: {
      type: 'uuid',
      references: 'trainers(id)',
      onDelete: 'SET NULL',
    },
    category: {
      type: 'class_category',
      notNull: true,
    },
    difficulty_level: {
      type: 'varchar(20)',
      default: 'intermediate',
      check: "difficulty_level IN ('beginner', 'intermediate', 'advanced')",
    },
    equipment_needed: {
      type: 'text[]',
    },
    is_active: {
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
  pgm.createIndex('classes', 'name');
  pgm.createIndex('classes', 'trainer_id');
  pgm.createIndex('classes', 'category');
  pgm.createIndex('classes', 'is_active');

  // Create trigger for updating updated_at
  pgm.sql(`
    CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('classes', 'update_classes_updated_at', { ifExists: true });
  pgm.dropTable('classes');
  pgm.dropType('class_category');
};
