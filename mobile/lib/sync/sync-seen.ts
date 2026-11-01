import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncKind } from '@/lib/types';

const KEY = '@sync_seen';

/** The versions of each data kind this device last synced, and whose they are. */
export interface SeenState {
  ownerUid: string | null;
  /** Role and household at the last sync, or null before the first one. */
  scope: string | null;
  seen: Partial<Record<SyncKind, string | null>>;
}

const NOTHING_SEEN: SeenState = { ownerUid: null, scope: null, seen: {} };

export const syncSeen = {
  async get(): Promise<SeenState> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw
        ? { ...NOTHING_SEEN, ...(JSON.parse(raw) as Partial<SeenState>) }
        : NOTHING_SEEN;
    } catch {
      return NOTHING_SEEN;
    }
  },

  async set(state: SeenState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Not remembering only means refetching everything at the next poll.
    }
  },
};
