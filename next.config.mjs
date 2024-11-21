/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';

// Load environment variables from .env.local or .env
dotenv.config();

const nextConfig = {
  crossOrigin: 'anonymous',

  // Expose all Firebase configuration variables to the client
  env: {
    FIREBASE_API_KEY: process.env.PRIVATE_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.PRIVATE_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.PRIVATE_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.PRIVATE_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.PRIVATE_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.PRIVATE_FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.PRIVATE_FIREBASE_MEASUREMENT_ID,
  },

  headers: async () => {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: '*' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
