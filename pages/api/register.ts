import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import initializeDb from '@/database/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const db = await initializeDb();
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', username);

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashedPassword);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}