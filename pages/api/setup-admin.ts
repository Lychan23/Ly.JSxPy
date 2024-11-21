// pages/api/setup-admin.ts
import { NextApiRequest, NextApiResponse } from 'next';
import admin from '@/lib/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Replace with your email
    const targetUserEmail = 'example.mail@example.com';
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(targetUserEmail);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true
    });
    
    // Update user document in Firestore
    await admin.firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set({
        email: targetUserEmail,
        roles: ['user', 'admin'],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    return res.status(200).json({ 
      message: 'Successfully set up admin user',
      uid: userRecord.uid 
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return res.status(500).json({ 
      error: 'Failed to set up admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}