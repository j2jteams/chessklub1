import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Debug: Log what values we're getting
console.log('[Firebase Config] API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING');
console.log('[Firebase Config] Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING');
console.log('[Firebase Config] Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');

// Your web app's Firebase configuration
// Uses environment variables exclusively (no fallbacks)
// For local development: Set in .env.local
// For production: Set as Firebase Secrets in apphosting.yaml
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log('[Firebase Config] Full config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

