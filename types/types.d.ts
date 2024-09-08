<<<<<<< HEAD

import { Socket as ClientSocket } from 'socket.io-client';

declare global {
  namespace SocketIO {
    interface Socket extends ClientSocket {}
  }
}

// types/types.d.ts

// Declare module for 'cookie'
declare module 'cookie' {
  // Add any specific types related to 'cookie' module here
}

// Declare module for '@vercel/analytics/react'
declare module '@vercel/analytics/react' {
  // Add any specific types related to '@vercel/analytics/react' module here
}

// Declare module for 'bcrypt'
declare module 'bcrypt' {
  // Add any specific types related to 'bcrypt' module here
}

declare module 'socket.io-client'

// global.d.ts
declare global {
  var serverProcess: import('child_process').ChildProcess | undefined;
}

export {};

// types.ts
export interface Result {
  title: string;
  description: string;
}
=======

import { Socket as ClientSocket } from 'socket.io-client';

declare global {
  namespace SocketIO {
    interface Socket extends ClientSocket {}
  }
}

// types/types.d.ts

// Declare module for 'cookie'
declare module 'cookie' {
  // Add any specific types related to 'cookie' module here
}

// Declare module for '@vercel/analytics/react'
declare module '@vercel/analytics/react' {
  // Add any specific types related to '@vercel/analytics/react' module here
}

// Declare module for 'bcrypt'
declare module 'bcrypt' {
  // Add any specific types related to 'bcrypt' module here
}

declare module 'socket.io-client'

// global.d.ts
declare global {
  var serverProcess: import('child_process').ChildProcess | undefined;
}

export {};

// types.ts
export interface Result {
  title: string;
  description: string;
}
>>>>>>> 5d566776e4ceb9d8df3ecbbb8a050a733ad6368e
