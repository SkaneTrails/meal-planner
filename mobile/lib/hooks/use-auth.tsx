/**
 * Authentication hook for Firebase Auth with Google Sign-In.
 * Provides user state and sign-in/sign-out methods.
 *
 * Uses Firebase's signInWithPopup for web and expo-auth-session for native.
 */

import * as Google from 'expo-auth-session/providers/google';
import {
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import { setAuthTokenGetter, setOnUnauthorized } from '../api';
import { auth, isFirebaseConfigured } from '../firebase';

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
const isAuthConfigured =
  isFirebaseConfigured &&
  Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
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
          signIn: async () =>
            console.warn('Auth not configured - using dev mode'),
          signOut: async () =>
            console.warn('Auth not configured - using dev mode'),
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
  // Track if we're currently handling an unauthorized response to prevent duplicates
  const handlingUnauthorizedRef = useRef(false);
  // Keep a ref to the current user for the token getter to avoid closure issues
  const userRef = useRef<User | null>(null);

  // For web: use Firebase's native GoogleAuthProvider
  const googleProvider =
    Platform.OS === 'web' ? new GoogleAuthProvider() : null;

  // For native: Configure expo-auth-session Google Auth
  // responseType: 'id_token' is required for Firebase Auth
  const [_request, response, promptAsync] = Google.useAuthRequest(
    Platform.OS !== 'web'
      ? {
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
          responseType: 'id_token',
        }
      : {
          // Minimal config for web (won't be used, but hook requires it)
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        },
  );

  // Register token getter for API client
  // Uses userRef to avoid stale closure issues - the ref is always current
  // Firebase automatically refreshes tokens when they're close to expiration
  useEffect(() => {
    setAuthTokenGetter(async () => {
      const currentUser = userRef.current;
      if (!currentUser) return null;
      try {
        return await currentUser.getIdToken();
      } catch {
        return null;
      }
    });
  }, []); // Empty deps - we read from ref, not state

  // Register sign-out callback for API 401/403 responses
  // This ensures stale auth state is cleared when token is invalid/expired
  // or when user doesn't have household access
  // hadToken: true means we sent a token but server rejected it (real auth failure)
  //           false means no token was available (race condition during sign-in)
  useEffect(() => {
    setOnUnauthorized((status: number, hadToken: boolean) => {
      // Only sign out and show alert if we actually sent a token
      // If no token was sent, it's likely a race condition during sign-in
      if (!hadToken) {
        return;
      }

      // Prevent duplicate handling from parallel requests
      if (handlingUnauthorizedRef.current) {
        return;
      }
      handlingUnauthorizedRef.current = true;

      firebaseSignOut(auth!).catch(() => {
        // Sign out error - user will need to retry
      });

      // Show user-friendly message for auth failures
      // 401 = token invalid/expired session
      // 403 = explicitly no household access
      let title: string;
      let message: string;
      if (status === 401) {
        title = 'Session Expired';
        message = 'Your session has expired. Please sign in again.';
      } else if (status === 403) {
        title = 'No Access';
        message =
          'Your account is not part of any household. Please contact an administrator to be added.';
      } else {
        title = 'Authentication Error';
        message = 'There was a problem with your session. Please sign in again.';
      }

      if (Platform.OS === 'web') {
        // Use window.alert on web for reliability; include title for consistency
        window.alert(`${title}\n\n${message}`);
      } else {
        Alert.alert(title, message, [{ text: 'OK' }]);
      }

      // Reset after a short delay to allow for retry after re-auth
      setTimeout(() => {
        handlingUnauthorizedRef.current = false;
      }, 1000);
    });
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Update ref immediately for the token getter
      userRef.current = firebaseUser;
      setUser(firebaseUser);
      setLoading(false);
      // Reset unauthorized flag when user signs in again
      if (firebaseUser) {
        handlingUnauthorizedRef.current = false;
      }
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
        console.error(
          'No id_token in response. Received:',
          Object.keys(response.params),
        );
        setError(
          'Authentication failed: No ID token received. Check OAuth configuration.',
        );
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
      const errorMessage =
        err instanceof Error ? err.message : 'Sign-in failed';
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
