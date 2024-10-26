import { readFileSync } from 'fs';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

const initializeDb = async (): Promise<Database> => {
  if (db) {
    return db;
  }

  const dbFilePath = path.join(process.cwd(), 'database', 'database.sqlite');
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');

  try {
    // Ensure the database file exists
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });

    // Read and execute schema
    const schema = readFileSync(schemaPath, 'utf8');
    await db.exec(schema);

    // Verify database connection
    const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    
    if (!tableCheck) {
      console.error('Users table not found after initialization');
      throw new Error('Database initialization failed');
    }

    // Check if columns exist before adding them
    const tableInfo = await db.all('PRAGMA table_info(users)');
    const columns = tableInfo.map(col => col.name);

    try {
      // Start transaction
      await db.exec('BEGIN TRANSACTION');

      // Add mfa_secret if it doesn't exist
      if (!columns.includes('mfa_secret')) {
        await db.exec('ALTER TABLE users ADD COLUMN mfa_secret TEXT');
      }

      // Add mfa_backup_codes if it doesn't exist
      if (!columns.includes('mfa_backup_codes')) {
        await db.exec('ALTER TABLE users ADD COLUMN mfa_backup_codes TEXT');
      }

      // Commit transaction
      await db.exec('COMMIT');
    } catch (error) {
      // Rollback in case of error
      await db.exec('ROLLBACK');
      console.error('Error modifying table structure:', error);
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export default initializeDb;