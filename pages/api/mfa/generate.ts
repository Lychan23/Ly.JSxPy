// pages/api/mfa/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Generate a TOTP secret
  const secret = authenticator.generateSecret();

  // Create a label for the QR code
  const label = `LyJSxPY-System:${req.body.username}`;

  // Generate the QR code URL
  const otpauth = authenticator.keyuri(req.body.username, 'LyJSxPY-System', secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);

  // You can also create backup codes here if needed

  res.status(200).json({ qrCode: qrCodeUrl, secret });
}
