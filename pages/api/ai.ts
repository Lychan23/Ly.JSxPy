import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

let serverProcess: any = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { action } = req.query;

    if (action === 'start') {
        if (serverProcess) {
            return res.status(400).json({ message: 'Server is already running.' });
        }

        serverProcess = exec('python ai/main.py', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                serverProcess = null;
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });

        return res.status(200).json({ message: 'Server started successfully.' });
    } else if (action === 'stop') {
        if (!serverProcess) {
            return res.status(400).json({ message: 'Server is not running.' });
        }

        serverProcess.kill();
        serverProcess = null;

        return res.status(200).json({ message: 'Server stopped successfully.' });
    } else {
        return res.status(400).json({ message: 'Invalid action.' });
    }
}
