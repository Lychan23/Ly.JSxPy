<<<<<<< HEAD
import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from '@/types/types';  // Adjust the path as necessary

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
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

            const data: { best_result: Result } = await response.json();
            res.status(200).json(data);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ message: `Failed to fetch: ${error.message}` });
            } else {
                res.status(500).json({ message: 'An unknown error occurred' });
            }
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
=======
import type { NextApiRequest, NextApiResponse } from 'next';
import { Result } from '@/types/types';  // Adjust the path as necessary

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
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

            const data: { best_result: Result } = await response.json();
            res.status(200).json(data);
        } catch (error) {
            if (error instanceof Error) {
                res.status(500).json({ message: `Failed to fetch: ${error.message}` });
            } else {
                res.status(500).json({ message: 'An unknown error occurred' });
            }
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
