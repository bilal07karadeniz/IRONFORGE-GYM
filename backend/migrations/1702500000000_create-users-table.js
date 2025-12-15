exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create enum for user roles
  pgm.createType('user_role', ['member', 'trainer', 'admin']);

  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password: {
      type: 'varchar(255)',
      notNull: true,
    },
    full_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    phone: {
      type: 'varchar(20)',
    },
    role: {
      type: 'user_role',
      notNull: true,
      default: 'member',
    },
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    refresh_token: {
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

  // Create indexes
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');
  pgm.createIndex('users', 'is_active');

  // Create trigger for updating updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = (pgm) => {
  pgm.dropTrigger('users', 'update_users_updated_at', { ifExists: true });
  pgm.dropTable('users');
  pgm.dropType('user_role');
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column();');
};
