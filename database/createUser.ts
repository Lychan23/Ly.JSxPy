import bcrypt from 'bcrypt';
import initializeDb from './db';
import { User } from '../types/user';

const createUser = async (username: string, password: string) => {
  const db = await initializeDb();
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err: Error | null) => {
    if (err) {
      console.error('Error creating user:', err);
    } else {
      console.log('User created successfully');
    }
  });
};

// Example usage
createUser('Lychan23', 'admin');
