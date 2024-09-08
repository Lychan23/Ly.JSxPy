import { NextApiResponse } from 'next';
import { exec } from 'child_process';
import socketMiddleware, { ExtendedNextApiRequest } from '../../middleware/socketMiddleware';
import os from 'os';

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const { io } = req;

  io.emit('message', 'Attempting to stop bot...');

  const stopBotCommand = os.platform() === 'win32' ? 'taskkill /F /IM python.exe /T' : 'pkill -f bot.py';

  exec(stopBotCommand, (error, stdout, stderr) => {
    if (error) {
      io.emit('message', 'No Python process found. Attempting to stop Docker container...');
      stopDockerContainer(io, res);
      return;
    }
    if (stderr) {
      io.emit('message', `Stderr stopping bot: ${stderr}`);
      res.status(500).json({ error: stderr });
      return;
    }
    io.emit('message', 'Bot stopped successfully');
    res.status(200).json({ message: 'Bot stopped successfully' });
  });
};

const stopDockerContainer = (io: any, res: NextApiResponse) => {
  exec(`docker ps -q --filter ancestor=${process.env.DOCKER}`, (dockerError, dockerStdout, dockerStderr) => {
    if (dockerError) {
      const dockerErrorMessage = `Error stopping Docker container: ${dockerError.message}`;
      io.emit('message', dockerErrorMessage);
      res.status(500).json({ error: dockerErrorMessage });
      return;
    }
    if (dockerStderr) {
      const dockerStderrMessage = `Stderr stopping Docker container: ${dockerStderr}`;
      io.emit('message', dockerStderrMessage);
      res.status(500).json({ error: dockerStderrMessage });
      return;
    }

    const containerId = dockerStdout.trim();
    if (containerId) {
      exec(`docker stop ${containerId}`, (stopError, stopStdout, stopStderr) => {
        if (stopError) {
          const stopErrorMessage = `Error stopping Docker container: ${stopError.message}`;
          io.emit('message', stopErrorMessage);
          res.status(500).json({ error: stopErrorMessage });
          return;
        }
        if (stopStderr) {
          const stopStderrMessage = `Stderr stopping Docker container: ${stopStderr}`;
          io.emit('message', stopStderrMessage);
          res.status(500).json({ error: stopStderrMessage });
          return;
        }
        io.emit('message', 'Docker container stopped successfully');
        res.status(200).json({ message: 'Docker container stopped successfully' });
      });
    } else {
      const noContainerMessage = 'No running Docker container found';
      io.emit('message', noContainerMessage);
      res.status(404).json({ message: noContainerMessage });
    }
  });
};

export default socketMiddleware(handler);

export const config = {
  api: {
    externalResolver: true,
  },
};
