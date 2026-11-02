import { auth, isFirebaseConfigured } from '@/lib/firebase';

export const DEV_USER_ID = 'dev-user';

/** The signed-in user's ID; keeps one user's data on this device away from the next user's. */
export function currentUserId(): string {
  if (!isFirebaseConfigured) return DEV_USER_ID;
  return auth?.currentUser?.uid ?? 'anonymous';
}
