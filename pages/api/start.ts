import { NextApiResponse } from 'next';
import { exec } from 'child_process';
import socketMiddleware, { ExtendedNextApiRequest } from '../../middleware/socketMiddleware';

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const { io } = req;

  io.emit('message', 'Starting bot...');

  const botProcess = exec('python -u "C:\\Users\\62878\\Desktop\\Ly.JSxPY\\bot.py"');

  if (botProcess.stdout) {
    botProcess.stdout.on('data', (data) => {
      const logMessage = data.toString();
      io.emit('log', logMessage);
      console.log(`stdout: ${logMessage}`);
    });
  }

  if (botProcess.stderr) {
    botProcess.stderr.on('data', (data) => {
      const logMessage = data.toString();
      io.emit('log', logMessage);
      console.error(`stderr: ${logMessage}`);
    });
  }

  botProcess.on('exit', (code) => {
    io.emit('message', `Bot process exited with code ${code}`);
    return res.status(200).json({ message: 'Bot started', exitCode: code });
  });

  botProcess.on('error', (error) => {
    io.emit('message', `exec error: ${error.message}`);
    console.error(`exec error: ${error.message}`);
    return res.status(500).json({ error: 'Error executing Python script' });
  });
};

export default socketMiddleware(handler);

export const config = {
  api: {
    externalResolver: true,
  },
};
