import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

let botProcess: ReturnType<typeof import('child_process').exec> | null = null;

interface ExtendedNextApiRequest extends NextApiRequest {
  io: Server;
}

export default function handler(req: ExtendedNextApiRequest, res: NextApiResponse) {
  if (botProcess) {
    botProcess.kill('SIGINT');
    botProcess = null;
    req.io.emit('activity', 'Bot stopped');
    res.send('Bot stopped');
  } else {
    res.send('Bot is not running');
  }
}
