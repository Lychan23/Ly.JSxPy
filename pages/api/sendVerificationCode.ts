import { NextApiRequest, NextApiResponse } from 'next';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

const sendVerificationCode = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const { email } = req.body;

        // Generate a TOTP secret
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(email, 'Ly.JsXpy', secret);

        // Generate a QR code
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        // Respond with the QR code and secret (store the secret in your database)
        return res.status(200).json({ qrCodeUrl, secret });
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed.' });
    }
};

export default sendVerificationCode;
