/**
 * Authentication hook for Firebase Auth with Google Sign-In.
 * Provides user state and sign-in/sign-out methods.
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from '../firebase';
import { setAuthTokenGetter } from '../api';

// NOTE: WebBrowser.maybeCompleteAuthSession() is called in app/_layout.tsx
// before any other imports to properly handle OAuth popup callbacks on web.

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

// Check if auth is configured
const isAuthConfigured = Boolean(
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

  // Configure Google Auth
  // Get these from Firebase Console > Project Settings > General > Your apps
  // responseType: 'id_token' is required for Firebase Auth on web
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    responseType: 'id_token',
  });

  // Debug: Log the redirect URI being used
  useEffect(() => {
    if (request?.redirectUri) {
      console.log('OAuth Redirect URI:', request.redirectUri);
    }
  }, [request]);

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      // Debug: log response params to see what we received
      console.log('OAuth response params:', response.params);

      const { id_token, access_token } = response.params;

      // Google OAuth returns id_token for implicit flow, but expo-auth-session
      // may return access_token depending on configuration
      if (!id_token) {
        console.error('No id_token in response. Received:', Object.keys(response.params));
        setError('Authentication failed: No ID token received. Check OAuth configuration.');
        return;
      }

      const credential = GoogleAuthProvider.credential(id_token, access_token);

      signInWithCredential(auth, credential)
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
      await promptAsync();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
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
