exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add email verification fields to users table
  pgm.addColumns('users', {
    email_verified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    email_verification_token: {
      type: 'varchar(255)',
    },
    email_verification_expires: {
      type: 'timestamp with time zone',
    },
    password_reset_token: {
      type: 'varchar(255)',
    },
    password_reset_expires: {
      type: 'timestamp with time zone',
    },
    last_login: {
      type: 'timestamp with time zone',
    },
    login_attempts: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    locked_until: {
      type: 'timestamp with time zone',
    },
  });

  // Create token blacklist table for invalidated refresh tokens
  pgm.createTable('token_blacklist', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    token_hash: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    expires_at: {
      type: 'timestamp with time zone',
      notNull: true,
    },
    blacklisted_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    reason: {
      type: 'varchar(50)',
      default: 'logout',
    },
  });

  // Create indexes
  pgm.createIndex('token_blacklist', 'token_hash');
  pgm.createIndex('token_blacklist', 'user_id');
  pgm.createIndex('token_blacklist', 'expires_at');
  pgm.createIndex('users', 'email_verification_token');
  pgm.createIndex('users', 'password_reset_token');

  // Create cleanup function for expired blacklisted tokens
  pgm.sql(`
    CREATE OR REPLACE FUNCTION cleanup_expired_blacklist_tokens()
    RETURNS void AS $$
    BEGIN
      DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP FUNCTION IF EXISTS cleanup_expired_blacklist_tokens();');
  pgm.dropTable('token_blacklist');
  pgm.dropColumns('users', [
    'email_verified',
    'email_verification_token',
    'email_verification_expires',
    'password_reset_token',
    'password_reset_expires',
    'last_login',
    'login_attempts',
    'locked_until',
  ]);
};
