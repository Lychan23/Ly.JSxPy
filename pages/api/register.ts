import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { db } from '@/firebase/firebaseConfig'; // Import Firestore database
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Define a reference to the user document in Firestore
    const userRef = doc(collection(db, 'users'), username);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user to Firestore
    await setDoc(userRef, {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
