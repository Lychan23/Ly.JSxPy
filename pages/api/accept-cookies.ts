import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    res.setHeader('Set-Cookie', 'accepted_cookies=true; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict');
    return res.status(200).json({ message: 'Cookies accepted' });
  }
  res.status(405).json({ message: 'Method not allowed' });
}
