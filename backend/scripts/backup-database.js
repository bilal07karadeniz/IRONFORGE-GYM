#!/usr/bin/env node

/**
 * Database Backup Script
 *
 * Creates a backup of the PostgreSQL database using pg_dump.
 * Backups are stored in the backups/ directory with timestamps.
 *
 * Usage:
 *   node scripts/backup-database.js
 *   npm run db:backup
 *
 * Environment Variables Required:
 *   - DB_HOST: Database host
 *   - DB_PORT: Database port
 *   - DB_NAME: Database name
 *   - DB_USER: Database user
 *   - DB_PASSWORD: Database password (or use PGPASSWORD)
 *
 * Options:
 *   --output, -o: Custom output directory (default: ./backups)
 *   --format, -f: Output format: plain, custom, directory, tar (default: custom)
 *   --schema-only: Only backup schema, not data
 *   --data-only: Only backup data, not schema
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'gym_appointment',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// Parse command line arguments
const args = process.argv.slice(2);
let outputDir = path.join(__dirname, '..', 'backups');
let format = 'custom';
let schemaOnly = false;
let dataOnly = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--output':
    case '-o':
      outputDir = args[++i];
      break;
    case '--format':
    case '-f':
      format = args[++i];
      break;
    case '--schema-only':
      schemaOnly = true;
      break;
    case '--data-only':
      dataOnly = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Database Backup Script

Usage: node scripts/backup-database.js [options]

Options:
  --output, -o <dir>    Output directory (default: ./backups)
  --format, -f <fmt>    Output format: plain, custom, directory, tar (default: custom)
  --schema-only         Only backup schema, not data
  --data-only           Only backup data, not schema
  --help, -h            Show this help message

Examples:
  node scripts/backup-database.js
  node scripts/backup-database.js -o /path/to/backups -f plain
  node scripts/backup-database.js --schema-only
      `);
      process.exit(0);
  }
}

// Create backups directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created backup directory: ${outputDir}`);
}

// Generate filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const extension = format === 'plain' ? 'sql' : (format === 'tar' ? 'tar' : 'dump');
let filename = `backup_${config.database}_${timestamp}`;
if (schemaOnly) filename += '_schema';
if (dataOnly) filename += '_data';
filename += `.${extension}`;
const backupPath = path.join(outputDir, filename);

// Build pg_dump command
let command = `pg_dump`;
command += ` --host=${config.host}`;
command += ` --port=${config.port}`;
command += ` --username=${config.user}`;
command += ` --format=${format.charAt(0)}`; // p, c, d, or t
command += ` --file="${backupPath}"`;

if (schemaOnly) command += ' --schema-only';
if (dataOnly) command += ' --data-only';

// Add compression for custom format
if (format === 'custom') {
  command += ' --compress=9';
}

// Add verbose output
command += ' --verbose';

// Add database name
command += ` ${config.database}`;

console.log('========================================');
console.log('Gym Appointment Database Backup');
console.log('========================================');
console.log(`Database: ${config.database}`);
console.log(`Host: ${config.host}:${config.port}`);
console.log(`Format: ${format}`);
console.log(`Output: ${backupPath}`);
console.log('----------------------------------------');

try {
  // Set password in environment
  const env = { ...process.env, PGPASSWORD: config.password };

  console.log('Starting backup...\n');
  execSync(command, { stdio: 'inherit', env });

  // Get file size
  const stats = fs.statSync(backupPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('\n========================================');
  console.log('Backup completed successfully!');
  console.log(`File: ${backupPath}`);
  console.log(`Size: ${fileSizeMB} MB`);
  console.log('========================================');

  // Clean up old backups (keep last 10)
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith('backup_'))
    .map(f => ({
      name: f,
      path: path.join(outputDir, f),
      time: fs.statSync(path.join(outputDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > 10) {
    console.log('\nCleaning up old backups...');
    files.slice(10).forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`  Deleted: ${file.name}`);
    });
  }

} catch (error) {
  console.error('\n========================================');
  console.error('Backup failed!');
  console.error('========================================');
  console.error('Error:', error.message);
  console.error('\nMake sure pg_dump is installed and accessible.');
  console.error('On Windows: Install PostgreSQL and add bin folder to PATH');
  console.error('On Linux/Mac: sudo apt install postgresql-client or brew install postgresql');
  process.exit(1);
}
