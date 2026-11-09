/**
 * Sync status endpoint: one small request that says which data kinds changed.
 */

import type { SyncStatus } from '../types';
import { apiRequest } from './client';

export const syncApi = {
  getSyncStatus: (): Promise<SyncStatus> =>
    apiRequest<SyncStatus>('/sync/status'),
};
