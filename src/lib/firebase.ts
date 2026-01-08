import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
};

// Initialize Firebase
// During build, if env vars aren't available, we'll use a placeholder config
// This allows the build to complete; at runtime, the real config should be available
const hasValidConfig = firebaseConfig.apiKey && 
                       firebaseConfig.apiKey !== '' && 
                       firebaseConfig.projectId && 
                       firebaseConfig.projectId !== '';

let app: ReturnType<typeof initializeApp>;
if (hasValidConfig) {
  // Use real config if available
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
  // Check if we already have an app initialized (might be from a previous import)
  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = getApp();
  } else {
    // During build, use placeholder to allow compilation
    // At runtime with real env vars, this won't be reached
    const placeholderConfig = {
      apiKey: 'build-placeholder',
      authDomain: 'placeholder.firebaseapp.com',
      projectId: 'placeholder-project',
      storageBucket: 'placeholder-project.appspot.com',
      messagingSenderId: '000000000',
      appId: '1:000000000:web:placeholder',
    };
    app = initializeApp(placeholderConfig, 'placeholder');
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
