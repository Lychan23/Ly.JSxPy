import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import initializeDb from '@/database/db';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
  throw new Error('JWT_SECRET is not defined or is not a string');
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password, rememberMe } = req.body;

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

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username 
      }, 
      JWT_SECRET, 
      {
        expiresIn: rememberMe ? '7d' : '1d'
      }
    );

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: rememberMe ? 60 * 60 * 24 * 7 * 1000 : 60 * 60 * 24 * 1000, // 7 days or 1 day
      sameSite: 'strict' as const,
      path: '/',
    };

    // Set the cookie
    res.setHeader('Set-Cookie', serialize('auth-token', token, cookieOptions));

    // Return success response
    return res.status(200).json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (err) {
    console.error('Error during authentication:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export default handler;