const app = require('./app');
const config = require('./config');
const { checkConnection, closePool } = require('./config/database');

const startServer = async () => {
  try {
    // Check database connection
    console.log('Checking database connection...');
    const dbStatus = await checkConnection();

    if (!dbStatus.connected) {
      console.error('Failed to connect to database:', dbStatus.error);
      process.exit(1);
    }

    console.log('Database connected successfully at:', dbStatus.timestamp);

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🏋️  Gym Appointment Booking System API                      ║
║                                                               ║
║   Environment: ${config.env.padEnd(43)}║
║   Port: ${config.port.toString().padEnd(50)}║
║   API Base: http://localhost:${config.port}/api/v1${' '.repeat(25)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        console.log('HTTP server closed');

        try {
          await closePool();
          console.log('Cleanup completed. Exiting...');
          process.exit(0);
        } catch (error) {
          console.error('Error during cleanup:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
