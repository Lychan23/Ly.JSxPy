import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import initializeDb from '../../database/db';
import { User } from '../../types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const db = await initializeDb();
    const user = await db.get<User>('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.setHeader('Set-Cookie', serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict',
      path: '/',
    }));

    return res.status(200).json({ success: true, token });

  } catch (err: unknown) {
    console.error('Error during authentication:', err);

    if (err instanceof SyntaxError && err.message.includes('Unexpected end of JSON input')) {
      return res.status(400).json({ success: false, message: 'Invalid JSON input' });
    }

    if (err instanceof Error && err.message.includes('SQLITE_ERROR')) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default handler;
