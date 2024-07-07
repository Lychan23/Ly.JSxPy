import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { Server as SocketIOServer } from 'socket.io';

interface ExtendedNextApiRequest extends NextApiRequest {
  io: SocketIOServer;
}

export default function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  exec('pnpm svr', (error: any, stdout: any, stderr: any) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).send('Failed to start the server');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send('Failed to start the server');
    }
    req.io.emit('activity', 'Server started');
    res.send('Server started');
  });
}
