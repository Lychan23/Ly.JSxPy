// database/db.ts
import { readFileSync } from 'fs';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database;

const initializeDb = async (): Promise<Database> => {
  const dbFilePath = 'database/database.sqlite';
  const schemaPath = 'database/schema.sql';

  db = await open({
    filename: dbFilePath,
    driver: sqlite3.Database
  });

  const schema = readFileSync(schemaPath, 'utf8');
  await db.exec(schema);
  console.log('Database schema created/verified.');

  return db;
};

export const sampleQuery = async (userInput: string) => {
  try {
    const statement = await db.prepare('SELECT * FROM users WHERE id = ?');
    const result = await statement.get(userInput);
    await statement.finalize();
    return result;
  } catch (error) {
    console.error('SQL error:', error);
  }
};

export default initializeDb;
