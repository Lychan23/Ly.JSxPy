require('dotenv').config();
const express = require('express');
const next = require('next');
const path = require('path');
const socketIO = require('socket.io');
const rateLimit = require('express-rate-limit');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: 'Too many requests, please try again later.',
  });

  server.use(limiter);
  server.use(express.json());

  const httpServer = server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  const io = socketIO(httpServer);
  server.set('io', io);

  io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  server.all('*', (req, res) => {
    req.io = io; // Attach io to the req object
    return handle(req, res);
  });
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
