import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { feedback } = req.body;

    try {
        const response = await fetch('http://localhost:8000/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ feedback }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        res.status(200).json({ message: 'Feedback received' });
    } catch (error: any) {
        res.status(500).json({ message: `Error forwarding request to FastAPI: ${error.message}` });
    }
}