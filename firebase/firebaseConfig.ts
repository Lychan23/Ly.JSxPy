import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

function initializeFirebase(): FirebaseApp {
  try {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Initialize app
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = initializeFirebase();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Add auth state logging only in client side
  if (typeof window !== 'undefined') {
    auth.onAuthStateChanged(
      (user) => {
        if (user) {
          console.log('User is signed in');
        } else {
          console.log('No user is signed in');
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
      }
    );
  }
} catch (error) {
  console.error('Error initializing Firebase services:', error);
  throw error;
}

export { auth, db, storage };
export type { Auth, Firestore, FirebaseStorage };
