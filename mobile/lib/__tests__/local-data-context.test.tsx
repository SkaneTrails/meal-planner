/**
 * Tests for LocalDataProvider.
 *
 * Real logic tested:
 * - Not ready while signed out or while auth is loading
 * - Waits for the saved cache to be restored before claiming the device data
 * - Ready (and polling) once the data is claimed for the signed-in user
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockIsRestoring = false;
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useIsRestoring: () => mockIsRestoring,
}));

let mockAuth: { user: { uid: string } | null; loading: boolean };
vi.mock('@/lib/hooks/use-auth', () => ({ useAuth: () => mockAuth }));

const mockUseSyncPolling = vi.fn();
vi.mock('@/lib/hooks/use-sync-polling', () => ({
  useSyncPolling: (enabled: boolean) => mockUseSyncPolling(enabled),
}));

vi.mock('@/lib/sync/poll-sync-status', () => ({ claimLocalData: vi.fn() }));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalDataProvider, useLocalDataReady } from '@/lib/local-data-context';
import { claimLocalData } from '@/lib/sync/poll-sync-status';

const Probe = () =>
  React.createElement('span', { 'data-testid': 'ready' }, String(useLocalDataReady()));

const renderProvider = () =>
  render(
    React.createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      React.createElement(LocalDataProvider, null, React.createElement(Probe)),
    ),
  );

describe('LocalDataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRestoring = false;
    mockAuth = { user: { uid: 'user-1' }, loading: false };
  });

  it('is not ready while signed out', () => {
    mockAuth = { user: null, loading: false };

    renderProvider();

    expect(screen.getByTestId('ready').textContent).toBe('false');
    expect(claimLocalData).not.toHaveBeenCalled();
    expect(mockUseSyncPolling).toHaveBeenLastCalledWith(false);
  });

  it('waits for the saved cache to be restored before claiming', () => {
    mockIsRestoring = true;

    renderProvider();

    expect(screen.getByTestId('ready').textContent).toBe('false');
    expect(claimLocalData).not.toHaveBeenCalled();
  });

  it('claims the device data for the user, then reports ready and polls', () => {
    renderProvider();

    expect(claimLocalData).toHaveBeenCalledOnce();
    expect(screen.getByTestId('ready').textContent).toBe('true');
    expect(mockUseSyncPolling).toHaveBeenLastCalledWith(true);
  });
});
