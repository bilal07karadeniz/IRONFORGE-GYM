#!/usr/bin/env node

/**
 * Database Restore Script
 *
 * Restores a PostgreSQL database backup created by backup-database.js
 *
 * Usage:
 *   node scripts/restore-database.js <backup-file>
 *   npm run db:restore -- backups/backup_gym_appointment_2024-01-01_12-00-00.dump
 *
 * Environment Variables Required:
 *   - DB_HOST: Database host
 *   - DB_PORT: Database port
 *   - DB_NAME: Database name
 *   - DB_USER: Database user
 *   - DB_PASSWORD: Database password
 *
 * Options:
 *   --clean: Drop database objects before recreating
 *   --create: Create the database before restoring
 *   --data-only: Only restore data, not schema
 *   --schema-only: Only restore schema, not data
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

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
let backupFile = null;
let clean = false;
let create = false;
let dataOnly = false;
let schemaOnly = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--clean':
      clean = true;
      break;
    case '--create':
      create = true;
      break;
    case '--data-only':
      dataOnly = true;
      break;
    case '--schema-only':
      schemaOnly = true;
      break;
    case '--help':
    case '-h':
      console.log(`
Database Restore Script

Usage: node scripts/restore-database.js <backup-file> [options]

Options:
  --clean          Drop database objects before recreating
  --create         Create the database before restoring
  --data-only      Only restore data, not schema
  --schema-only    Only restore schema, not data
  --help, -h       Show this help message

Examples:
  node scripts/restore-database.js backups/backup.dump
  node scripts/restore-database.js backups/backup.dump --clean
      `);
      process.exit(0);
    default:
      if (!args[i].startsWith('--')) {
        backupFile = args[i];
      }
  }
}

if (!backupFile) {
  console.error('Error: No backup file specified');
  console.error('Usage: node scripts/restore-database.js <backup-file>');
  process.exit(1);
}

// Resolve backup file path
if (!path.isAbsolute(backupFile)) {
  backupFile = path.join(process.cwd(), backupFile);
}

if (!fs.existsSync(backupFile)) {
  console.error(`Error: Backup file not found: ${backupFile}`);
  process.exit(1);
}

// Determine file format
const ext = path.extname(backupFile).toLowerCase();
const isPlainSQL = ext === '.sql';

// Confirmation prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('========================================');
console.log('Gym Appointment Database Restore');
console.log('========================================');
console.log(`Database: ${config.database}`);
console.log(`Host: ${config.host}:${config.port}`);
console.log(`Backup File: ${backupFile}`);
console.log(`Clean: ${clean}`);
console.log(`Create Database: ${create}`);
console.log('----------------------------------------');
console.log('\nWARNING: This will overwrite existing data!');

rl.question('\nAre you sure you want to continue? (yes/no): ', (answer) => {
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('Restore cancelled.');
    process.exit(0);
  }

  // Set password in environment
  const env = { ...process.env, PGPASSWORD: config.password };

  try {
    let command;

    if (isPlainSQL) {
      // Use psql for plain SQL files
      command = `psql`;
      command += ` --host=${config.host}`;
      command += ` --port=${config.port}`;
      command += ` --username=${config.user}`;
      command += ` --dbname=${config.database}`;
      command += ` --file="${backupFile}"`;
    } else {
      // Use pg_restore for custom/tar format
      command = `pg_restore`;
      command += ` --host=${config.host}`;
      command += ` --port=${config.port}`;
      command += ` --username=${config.user}`;
      command += ` --dbname=${config.database}`;
      command += ' --verbose';

      if (clean) command += ' --clean';
      if (create) command += ' --create';
      if (dataOnly) command += ' --data-only';
      if (schemaOnly) command += ' --schema-only';

      command += ` "${backupFile}"`;
    }

    console.log('\nStarting restore...\n');
    execSync(command, { stdio: 'inherit', env });

    console.log('\n========================================');
    console.log('Restore completed successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('\n========================================');
    console.error('Restore failed!');
    console.error('========================================');
    console.error('Error:', error.message);
    process.exit(1);
  }
});
