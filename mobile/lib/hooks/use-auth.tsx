/**
 * Authentication hook for Firebase Auth with Google Sign-In.
 * Provides user state and sign-in/sign-out methods.
 *
 * Uses Firebase's signInWithPopup for web and expo-auth-session for native.
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  User,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import { auth, isFirebaseConfigured } from '../firebase';
import { setAuthTokenGetter } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Check if auth is configured (Firebase + OAuth client IDs)
const isAuthConfigured = isFirebaseConfigured && Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
);

export function AuthProvider({ children }: AuthProviderProps) {
  // If auth is not configured, provide a mock authenticated user for development
  if (!isAuthConfigured) {
    return (
      <AuthContext.Provider
        value={{
          user: { email: 'dev@localhost' } as User,
          loading: false,
          error: null,
          signIn: async () => console.warn('Auth not configured - using dev mode'),
          signOut: async () => console.warn('Auth not configured - using dev mode'),
          getIdToken: async () => null,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return <AuthProviderImpl>{children}</AuthProviderImpl>;
}

function AuthProviderImpl({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For web: use Firebase's native GoogleAuthProvider
  const googleProvider = Platform.OS === 'web' ? new GoogleAuthProvider() : null;

  // For native: Configure expo-auth-session Google Auth
  // responseType: 'id_token' is required for Firebase Auth
  const [request, response, promptAsync] = Google.useAuthRequest(
    Platform.OS !== 'web'
      ? {
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
          responseType: 'id_token',
        }
      : {
          // Minimal config for web (won't be used, but hook requires it)
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        }
  );

  // Register token getter for API client
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!user) return null;
      try {
        return await user.getIdToken();
      } catch {
        return null;
      }
    });
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle Google sign-in response (native only)
  useEffect(() => {
    // Skip for web - we use signInWithPopup
    if (Platform.OS === 'web') return;

    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;

      if (!id_token) {
        console.error('No id_token in response. Received:', Object.keys(response.params));
        setError('Authentication failed: No ID token received. Check OAuth configuration.');
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token, access_token);

      signInWithCredential(auth!, credential)
        .then(() => {
          setError(null);
        })
        .catch((err) => {
          console.error('signInWithCredential error:', err);
          setError(err.message);
        });
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Sign-in failed');
    }
  }, [response]);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      if (Platform.OS === 'web' && googleProvider) {
        // Web: Use Firebase's popup auth
        console.log('Starting signInWithPopup...');
        const result = await signInWithPopup(auth!, googleProvider);
        console.log('signInWithPopup success:', result.user.email);
      } else {
        // Native: Use expo-auth-session
        await promptAsync();
      }
    } catch (err) {
      console.error('signIn error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Sign-in failed';
      // Don't show error for user-cancelled popups
      if (!errorMessage.includes('popup-closed-by-user')) {
        setError(errorMessage);
      }
    }
  }, [promptAsync, googleProvider]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth!);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-out failed');
    }
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (err) {
      console.error('Failed to get ID token:', err);
      return null;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
