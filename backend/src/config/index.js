require('dotenv').config();

// Parse DATABASE_URL if provided (Railway, Heroku, etc.)
const parseDbUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 5432,
      database: parsed.pathname.slice(1),
      user: parsed.username,
      password: parsed.password,
    };
  } catch {
    return null;
  }
};

const dbFromUrl = parseDbUrl(process.env.DATABASE_URL);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  db: {
    // Support DATABASE_URL (Railway/Heroku) or individual variables
    host: dbFromUrl?.host || process.env.DB_HOST || 'localhost',
    port: dbFromUrl?.port || parseInt(process.env.DB_PORT, 10) || 5432,
    database: dbFromUrl?.database || process.env.DB_NAME || 'gym_appointment',
    user: dbFromUrl?.user || process.env.DB_USER || 'postgres',
    password: dbFromUrl?.password || process.env.DB_PASSWORD || '',
    // For Railway PostgreSQL with SSL
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    // Connection pool configuration
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // Limit each IP to 100 requests per windowMs
  },

  bcrypt: {
    saltRounds: 12,
  },
};

// Validate required configuration in production
if (config.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  // Require either DATABASE_URL or individual DB variables
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasDbVars = process.env.DB_HOST && process.env.DB_PASSWORD;

  if (!hasDbUrl && !hasDbVars) {
    throw new Error('Missing database configuration: Provide DATABASE_URL or (DB_HOST and DB_PASSWORD)');
  }

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

module.exports = config;
