import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
require('dotenv').config();

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const { username, password } = req.body;

  // Simple authentication logic for demonstration purposes
  if (username === 'Lychan23' && password === 'admin') {
    const token = 'secure-auth-token'; // Generate a secure token in a real application

    // Set the auth token as a cookie
    res.setHeader('Set-Cookie', serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'strict',
      path: '/',
    }));

    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
};

export default handler;
