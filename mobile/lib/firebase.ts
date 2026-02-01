/**
 * Firebase configuration for the Meal Planner mobile app.
 *
 * Get your config from Firebase Console:
 * Project Settings > General > Your apps > Web app > Config
 *
 * If EXPO_PUBLIC_FIREBASE_API_KEY is not set, Firebase is not initialized
 * and the app runs in "dev mode" with a mock authenticated user.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

// Check if Firebase is configured
export const isFirebaseConfigured = Boolean(process.env.EXPO_PUBLIC_FIREBASE_API_KEY);

// Firebase configuration - use environment variables for production
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
}

// Google provider for sign-in
export const googleProvider = new GoogleAuthProvider();

export { auth };
export default app;
