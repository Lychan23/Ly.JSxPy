// database/db.ts
import { readFileSync } from 'fs';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const initializeDb = async (): Promise<Database> => {
  const dbFilePath = 'C:/Users/62878/Desktop/Ly.JSxPY/database/database.sqlite';
  const schemaPath = 'C:/Users/62878/Desktop/Ly.JSxPY/database/schema.sql';

  const db = await open({
    filename: dbFilePath,
    driver: sqlite3.Database
  });

  const schema = readFileSync(schemaPath, 'utf8');
  await db.exec(schema);
  console.log('Database schema created/verified.');

  return db;
};

export default initializeDb;
