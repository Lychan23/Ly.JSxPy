<<<<<<< HEAD
import { NextApiResponse } from 'next';
import { exec } from 'child_process';
import socketMiddleware, { ExtendedNextApiRequest } from '../../middleware/socketMiddleware';

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const { io } = req;

  io.emit('message', 'Starting Docker container...');

  const dockerCommand = `docker run ${process.env.DOCKER}`;
  const dockerProcess = exec(dockerCommand);

  dockerProcess.stdout?.on('data', (data) => {
    const logMessage = data.toString();
    io.emit('log', logMessage);
    console.log(`stdout: ${logMessage}`);
  });

  dockerProcess.stderr?.on('data', (data) => {
    const logMessage = data.toString();
    io.emit('log', logMessage);
    console.error(`stderr: ${logMessage}`);
  });

  dockerProcess.on('exit', (code) => {
    const exitMessage = `Docker process exited with code ${code}`;
    io.emit('message', exitMessage);
    console.log(exitMessage);
    res.status(200).json({ message: 'Docker container started', exitCode: code });
  });

  dockerProcess.on('error', (error) => {
    const errorMessage = `exec error: ${error.message}`;
    io.emit('message', errorMessage);
    console.error(errorMessage);
    res.status(500).json({ error: 'Error executing Docker command' });
  });
};

export default socketMiddleware(handler);

export const config = {
  api: {
    externalResolver: true,
  },
};
=======
import { NextApiResponse } from 'next';
import { exec } from 'child_process';
import socketMiddleware, { ExtendedNextApiRequest } from '../../middleware/socketMiddleware';

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const { io } = req;

  io.emit('message', 'Starting Docker container...');

  const dockerCommand = `docker run ${process.env.DOCKER}`;
  const dockerProcess = exec(dockerCommand);

  dockerProcess.stdout?.on('data', (data) => {
    const logMessage = data.toString();
    io.emit('log', logMessage);
    console.log(`stdout: ${logMessage}`);
  });

  dockerProcess.stderr?.on('data', (data) => {
    const logMessage = data.toString();
    io.emit('log', logMessage);
    console.error(`stderr: ${logMessage}`);
  });

  dockerProcess.on('exit', (code) => {
    const exitMessage = `Docker process exited with code ${code}`;
    io.emit('message', exitMessage);
    console.log(exitMessage);
    res.status(200).json({ message: 'Docker container started', exitCode: code });
  });

  dockerProcess.on('error', (error) => {
    const errorMessage = `exec error: ${error.message}`;
    io.emit('message', errorMessage);
    console.error(errorMessage);
    res.status(500).json({ error: 'Error executing Docker command' });
  });
};

export default socketMiddleware(handler);

export const config = {
  api: {
    externalResolver: true,
  },
};
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
