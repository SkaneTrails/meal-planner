/**
 * Tests for useHouseholds hook — verifies the `enabled` guard.
 *
 * Bug caught: PR #136 — useHouseholds() was called unconditionally on the recipe
 * detail page. For non-superuser members this hit GET /admin/households (superuser-only),
 * triggering a 403 → global sign-out. The fix added an `enabled` option.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/test/helpers';

// Mock the api module before importing the hook
const mockGetHouseholds = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    getHouseholds: (...args: any[]) => mockGetHouseholds(...args),
    getCurrentUser: vi.fn().mockResolvedValue({
      uid: 'test', email: 'test@example.com', role: 'member', household_id: 'h1',
    }),
  },
}));

import { useHouseholds } from '@/lib/hooks/use-admin';

describe('useHouseholds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHouseholds.mockResolvedValue([{ id: 'h1', name: 'Test' }]);
  });

  it('fetches households when enabled is true', async () => {
    const { result } = renderHook(
      () => useHouseholds({ enabled: true }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetHouseholds).toHaveBeenCalledTimes(1);
  });

  it('fetches households when no options provided (default enabled)', async () => {
    const { result } = renderHook(
      () => useHouseholds(),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetHouseholds).toHaveBeenCalledTimes(1);
  });

  it('does NOT fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => useHouseholds({ enabled: false }),
      { wrapper: createQueryWrapper() },
    );

    // Should stay in idle/pending state without ever fetching
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockGetHouseholds).not.toHaveBeenCalled();
  });

  it('prevents 403 for members by guarding with enabled: false', async () => {
    // Simulate the exact bug scenario: a member viewing a recipe page
    // should NOT trigger a households fetch
    const isSuperuser = false;

    const { result } = renderHook(
      () => useHouseholds({ enabled: isSuperuser }),
      { wrapper: createQueryWrapper() },
    );

    // The API should never be called — this is what prevented the 403 sign-out
    expect(mockGetHouseholds).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});
