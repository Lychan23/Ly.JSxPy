import { NextApiRequest, NextApiResponse } from 'next';
import { authenticator } from 'otplib';

// Check if REDIS_URL is defined
const verifyCode = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const { code, secret } = req.body;

        // Validate the TOTP code
        const isValid = authenticator.check(code, secret);

        if (isValid) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid code.' });
        }
    } else {
        return res.status(405).json({ success: false, message: 'Method not allowed.' });
    }
};

export default verifyCode;

