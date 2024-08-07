import { NextApiResponse } from 'next';
import { exec, ChildProcess } from 'child_process';
import socketMiddleware, { ExtendedNextApiRequest } from '../../middleware/socketMiddleware';
import os from 'os';

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const { io } = req;
  const { commandArgs } = req.body;

  io.emit('message', `Starting ${commandArgs === 'docker' ? 'Docker container' : 'bot'}...`);

  const isWindows = os.platform() === 'win32';
  const activateCommand = isWindows ? 'deps\\Scripts\\activate && python -u bot.py' : 'source deps/bin/activate && python -u bot.py';
  const dockerCommand = `docker run --rm ${process.env.DOCKER}`;
  
  const startCommand = commandArgs === 'docker' ? dockerCommand : activateCommand;

  const childProcess: ChildProcess = exec(startCommand);

  childProcess.stdout?.on('data', (data: Buffer) => {
    const logMessage = data.toString();
    io.emit('log', logMessage);
    console.log(`stdout: ${logMessage}`);
  });

  childProcess.stderr?.on('data', (data: Buffer) => {
    const logMessage = data.toString();
    io.emit('log', logMessage);
    console.error(`stderr: ${logMessage}`);
  });

  childProcess.on('exit', (code: number | null) => {
    const exitMessage = `${commandArgs === 'docker' ? 'Docker' : 'Bot'} process exited with code ${code}`;
    io.emit('message', exitMessage);
    console.log(exitMessage);
    res.status(200).json({ message: `${commandArgs === 'docker' ? 'Docker container' : 'Bot'} started`, exitCode: code });
  });

  childProcess.on('error', (error: Error) => {
    const errorMessage = `exec error: ${error.message}`;
    io.emit('message', errorMessage);
    console.error(errorMessage);
    res.status(500).json({ error: `Error executing ${commandArgs === 'docker' ? 'Docker' : 'Python'} command` });
  });
};

export default socketMiddleware(handler);

export const config = {
  api: {
    externalResolver: true,
  },
};
