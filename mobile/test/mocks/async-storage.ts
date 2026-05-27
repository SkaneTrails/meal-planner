/**
 * Mock for @react-native-async-storage/async-storage (v3).
 * Provides an in-memory implementation for tests.
 */

let store: Record<string, string> = {};

export const resetAsyncStorage = () => {
  store = {};
};

const AsyncStorage = {
  getItem: async (key: string) => store[key] ?? null,
  setItem: async (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: async (key: string) => {
    delete store[key];
  },
  clear: async () => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
  },
  getAllKeys: async () => Object.keys(store),
  multiGet: async (keys: string[]) => keys.map((k) => [k, store[k] ?? null]),
  multiSet: async (pairs: [string, string][]) => {
    for (const [k, v] of pairs) store[k] = v;
  },
  multiRemove: async (keys: string[]) => {
    for (const k of keys) delete store[k];
  },
};

export default AsyncStorage;
