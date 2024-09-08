// middleware/socketMiddleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

export interface ExtendedNextApiRequest extends NextApiRequest {
  io: Server;
}

let io: Server | null = null;

const socketMiddleware = (handler: (req: ExtendedNextApiRequest, res: NextApiResponse) => void) => (req: NextApiRequest, res: NextApiResponse) => {
  if (!io) {
    const httpServer: HttpServer = (req as any).socket.server;
    io = new Server(httpServer);
    (req as ExtendedNextApiRequest).io = io;
  } else {
    (req as ExtendedNextApiRequest).io = io;
  }
  return handler(req as ExtendedNextApiRequest, res);
};

export default socketMiddleware;
