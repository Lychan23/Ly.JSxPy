// Import required modules
import { NextApiResponse } from 'next';
import { exec } from 'child_process';
import socketMiddleware, { ExtendedNextApiRequest } from '../../middleware/socketMiddleware';

const handler = (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const { io } = req;

  // Emit initial log message
  io.emit('uvicornLog', 'Starting uvicorn server...');

  // Execute npm script to start Uvicorn
  const uvicornProcess = exec(`pnpm start-uvicorn`);

  // Handle stdout data
  if (uvicornProcess.stdout) {
    uvicornProcess.stdout.on('data', (data) => {
      const logMessage = data.toString();
      io.emit('uvicornLog', logMessage);
      console.log(`stdout: ${logMessage}`);
    });
  }

  // Handle stderr data
  if (uvicornProcess.stderr) {
    uvicornProcess.stderr.on('data', (data) => {
      const logMessage = data.toString();
      io.emit('uvicornLog', logMessage);
      console.error(`stderr: ${logMessage}`);
    });
  }

  // Handle process exit
  uvicornProcess.on('exit', (code) => {
    io.emit('uvicornLog', `Uvicorn process exited with code ${code}`);
    return res.status(200).json({ message: 'Uvicorn server started', exitCode: code });
  });

  // Handle process error
  uvicornProcess.on('error', (error) => {
    io.emit('uvicornLog', `exec error: ${error.message}`);
    console.error(`exec error: ${error.message}`);
    return res.status(500).json({ error: 'Error executing Uvicorn server' });
  });
};

// Export handler with socketMiddleware
export default socketMiddleware(handler);

// API configuration
export const config = {
  api: {
    externalResolver: true,
  },
};
