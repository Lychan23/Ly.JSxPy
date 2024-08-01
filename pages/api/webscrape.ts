import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { input } = req.body;

    try {
        const response = await fetch('http://localhost:8000/api/webscrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ message: `Error forwarding request to FastAPI: ${error.message}` });
    }
}