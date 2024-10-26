// pages/api/mfa/verify.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticator } from 'otplib';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code, secret } = req.body;

  // Verify the TOTP code
  const isValid = authenticator.check(code, secret);

  if (isValid) {
    // Optionally save the secret to the user’s account or session here
    return res.status(200).json({ message: 'Verification successful' });
  } else {
    return res.status(401).json({ message: 'Invalid verification code' });
  }
}
