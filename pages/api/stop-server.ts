import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        if (global.serverProcess) {
            exec('npm run stop-aiserver', (error) => {
                if (error) {
                    console.error(`Error stopping server: ${error}`);
                    return res.status(500).json({ status: 'Error stopping server' });
                }
                global.serverProcess = undefined;
                return res.status(200).json({ status: 'Server stopped' });
            });
        } else {
            return res.status(200).json({ status: 'Server is not running' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
