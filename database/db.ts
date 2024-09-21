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
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });

    const schema = readFileSync(schemaPath, 'utf8');

    // Execute schema
    await db.exec(schema);

    // Verify table creation
    const tableCheck = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
    if (!tableCheck) {
      throw new Error('Users table not created');
    }

    console.log('Database initialized successfully.');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const sampleQuery = async (userInput: string) => {
  if (!db) {
    await initializeDb();
  }
  try {
    const statement = await db!.prepare('SELECT * FROM users WHERE id = ?');
    const result = await statement.get(userInput);
    await statement.finalize();
    return result;
  } catch (error) {
    console.error('SQL error:', error);
    throw error;
  }
};

export default initializeDb;