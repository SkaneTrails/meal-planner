/**
 * Authentication hook for Firebase Auth with Google Sign-In.
 * Provides user state and sign-in/sign-out methods.
 *
 * Web: signInWithPopup for all browsers (including iOS Safari).
 * Native: @react-native-google-signin (the OS account picker), then the ID token is
 * handed to Firebase. Only the web client ID is needed; Google matches the Android app
 * through the Android OAuth client Firebase creates for the package and signing key.
 *
 * Note: signInWithRedirect was previously used for iOS Safari, but Safari's
 * ITP blocks cross-origin storage after the redirect through firebaseapp.com,
 * causing an infinite login loop. signInWithPopup works on iOS Safari — it
 * opens a new tab, and Firebase communicates the result back via
 * BroadcastChannel / localStorage events.
 */

import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
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
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { showNotification } from '../alert';
import { setAuthTokenGetter, setOnUnauthorized } from '../api';
import { auth, isFirebaseConfigured } from '../firebase';
import { translateStandalone } from '../i18n/translate';
import { getCurrentLanguage } from '../language-state';

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

const isAuthConfigured =
  isFirebaseConfigured && Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  if (!isAuthConfigured) {
    const shouldUseMockUser = __DEV__;
    const mockUser = { email: 'dev@localhost' } as User;
    const authError = shouldUseMockUser
      ? null
      : 'Authentication is not configured. Please set Firebase and Google OAuth environment variables.';

    return (
      <AuthContext.Provider
        value={{
          user: shouldUseMockUser ? mockUser : null,
          loading: false,
          error: authError,
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
};

const AuthProviderImpl = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track if we're currently handling an unauthorized response to prevent duplicates
  const handlingUnauthorizedRef = useRef(false);
  // Keep a ref to the current user for the token getter to avoid closure issues
  const userRef = useRef<User | null>(null);

  const googleProvider =
    Platform.OS === 'web' ? new GoogleAuthProvider() : null;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });
    }
  }, []);

  // Uses userRef to avoid stale closure issues - the ref is always current
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
  }, []);

  // hadToken: true means we sent a token but server rejected it (real auth failure)
  //           false means no token was available (race condition during sign-in)
  useEffect(() => {
    setOnUnauthorized((hadToken: boolean) => {
      if (!hadToken) {
        return;
      }

      if (handlingUnauthorizedRef.current) {
        return;
      }
      handlingUnauthorizedRef.current = true;

      firebaseSignOut(auth as NonNullable<typeof auth>).catch((err) => {
        if (__DEV__) {
          console.warn('Sign-out failed during unauthorized handling', err);
        }
      });

      const lang = getCurrentLanguage();
      const title = translateStandalone(lang, 'auth.sessionExpiredTitle');
      const message = translateStandalone(lang, 'auth.sessionExpiredMessage');

      showNotification(title, message);

      setTimeout(() => {
        handlingUnauthorizedRef.current = false;
      }, 1000);
    });
  }, []);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      userRef.current = firebaseUser;
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        handlingUnauthorizedRef.current = false;
      }
    });

    return unsubscribe;
  }, []);

  const signInNative = useCallback(async () => {
    const result = await GoogleSignin.signIn();
    if (!isSuccessResponse(result)) return;
    const idToken = result.data.idToken;
    if (!idToken) {
      setError('noIdToken');
      return;
    }
    await signInWithCredential(
      auth as NonNullable<typeof auth>,
      GoogleAuthProvider.credential(idToken),
    );
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    try {
      if (Platform.OS === 'web' && googleProvider) {
        await signInWithPopup(auth as NonNullable<typeof auth>, googleProvider);
      } else {
        await signInNative();
      }
    } catch (err) {
      if (__DEV__) {
        console.error('signIn error:', err);
      }
      const isWebPopupClosed =
        err instanceof Error && err.message.includes('popup-closed-by-user');
      const isNativeCancelled =
        isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED;
      if (!isWebPopupClosed && !isNativeCancelled) {
        setError('signInFailed');
      }
    }
  }, [googleProvider, signInNative]);

  const signOut = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
      await firebaseSignOut(auth as NonNullable<typeof auth>);
      setError(null);
    } catch (_err) {
      setError('signOutFailed');
    }
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (err) {
      if (__DEV__) {
        console.error('Failed to get ID token:', err);
      }
      return null;
    }
  }, [user]);

  const contextValue = useMemo<AuthContextType>(
    () => ({ user, loading, error, signIn, signOut, getIdToken }),
    [user, loading, error, signIn, signOut, getIdToken],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
