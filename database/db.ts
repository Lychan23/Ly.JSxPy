// database/db.ts
import { readFileSync } from 'fs';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database;

const initializeDb = async (): Promise<Database> => {
  const dbFilePath = 'database/database.sqlite';
  const schemaPath = 'database/schema.sql';

  try {
    db = await open({
      filename: dbFilePath,
      driver: sqlite3.Database,
    });

    const schema = readFileSync(schemaPath, 'utf8');

    // Ensure schema is only applied if necessary
    // Consider versioning schema or checking for existing tables

    await db.exec(schema);
    console.log('Database schema created/verified.');

    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const sampleQuery = async (userInput: string) => {
  try {
    const statement = await db.prepare('SELECT * FROM users WHERE id = ?');
    const result = await statement.get(userInput);
    await statement.finalize();
    return result;
  } catch (error) {
    console.error('SQL error:', error);
    throw error;
  }
};

export default initializeDb;
