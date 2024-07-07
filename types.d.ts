
import { Socket as ClientSocket } from 'socket.io-client';

declare global {
  namespace SocketIO {
    interface Socket extends ClientSocket {}
  }
}

declare module 'speedtest-net';
declare module 'socket.io-client';
declare module 'cookie';