// pages/api/admin/users.ts
import { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebase-admin';
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'user']),
  timestamp: z.number()
});

// Rate limiting setup
const rateLimit = {
  tokenCount: new Map<string, number>(),
  lastReset: Date.now(),
  interval: 60 * 1000, // 1 minute
  maxRequests: 10
};

// Simple rate limiting middleware
const checkRateLimit = (req: NextApiRequest): boolean => {
  const now = Date.now();
  if (now - rateLimit.lastReset > rateLimit.interval) {
    rateLimit.tokenCount.clear();
    rateLimit.lastReset = now;
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const currentCount = rateLimit.tokenCount.get(clientIp as string) || 0;

  if (currentCount >= rateLimit.maxRequests) {
    return false;
  }

  rateLimit.tokenCount.set(clientIp as string, currentCount + 1);
  return true;
};

// Auth middleware
const validateAuth = async (req: NextApiRequest) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.admin) {
      throw new Error('Insufficient permissions');
    }

    return decodedToken;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Rate limiting check
  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    // Validate authentication for all requests
    await validateAuth(req);

    switch (req.method) {
      case 'GET':
        // Handle GET request
        const db = admin.firestore();
        const usersSnapshot = await db.collection('users').get();
        
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return res.status(200).json({ users });

      case 'PUT':
        // Handle PUT request
        const validatedData = updateUserSchema.parse(req.body);
        
        await admin.firestore().runTransaction(async (transaction) => {
          const userRef = admin.firestore().collection('users').doc(validatedData.userId);
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists) {
            throw new Error('User not found');
          }

          // Update Firestore
          transaction.update(userRef, {
            roles: validatedData.role === 'admin' ? ['user', 'admin'] : ['user'],
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Update Auth claims
          await admin.auth().setCustomUserClaims(validatedData.userId, {
            admin: validatedData.role === 'admin'
          });
        });

        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.errors
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}