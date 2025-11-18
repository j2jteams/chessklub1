import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Environment variables are loaded from Firebase App Hosting secrets
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Debug logging (only in development or if config is missing)
if (typeof window !== 'undefined') {
  const isDev = process.env.NODE_ENV === 'development';
  const hasMissingConfig = !firebaseConfig.apiKey || !firebaseConfig.projectId;
  
  if (isDev || hasMissingConfig) {
    console.log('🔍 Firebase Config Debug:', {
      apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
      authDomain: firebaseConfig.authDomain || 'MISSING',
      projectId: firebaseConfig.projectId || 'MISSING',
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId,
      env: process.env.NODE_ENV,
    });
  }
}

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMsg = "Firebase configuration is incomplete. Please check your environment variables.";
  console.error("❌ Firebase configuration is missing!");
  console.error("API Key:", firebaseConfig.apiKey ? "Set" : "Missing");
  console.error("Project ID:", firebaseConfig.projectId ? "Set" : "Missing");
  console.error("Auth Domain:", firebaseConfig.authDomain || "Missing");
  
  // Don't throw in production to avoid breaking the app, but log the error
  if (typeof window !== 'undefined') {
    console.error(errorMsg);
  } else {
    throw new Error(errorMsg);
  }
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  console.error("❌ Firebase initialization failed:", error);
  throw error;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;

