import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import  admin from '@/lib/firebase-admin';

export async function authMiddleware(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user's custom claims (roles)
    const user = await admin.auth().getUser(decodedToken.uid);
    
    // Verify admin role
    const userRecord = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    const userData = userRecord.data();
    if (!userData?.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
