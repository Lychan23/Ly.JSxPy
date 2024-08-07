import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        if (!global.serverProcess) {
            global.serverProcess = exec('npm run start-aiserver', (error) => {
                if (error) {
                    console.error(`Error starting server: ${error}`);
                    global.serverProcess = undefined;
                }
            });
            return res.status(200).json({ status: 'Server started' });
        } else {
            return res.status(200).json({ status: 'Server is already running' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
