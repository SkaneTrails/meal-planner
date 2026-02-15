/**
 * Tests for admin hooks — verifies enabled guards and query behavior.
 *
 * Bug caught: PR #136 — useHouseholds() was called unconditionally on the recipe
 * detail page. For non-superuser members this hit GET /admin/households (superuser-only),
 * triggering a 403 → global sign-out. The fix added an `enabled` option.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createQueryWrapper } from '@/test/helpers';

// Mock the api module before importing the hook
vi.mock('@/lib/api', () => ({
  api: {
    getHouseholds: vi.fn(),
    getCurrentUser: vi.fn(),
    getHousehold: vi.fn(),
    getHouseholdMembers: vi.fn(),
    createHousehold: vi.fn(),
    renameHousehold: vi.fn(),
    addHouseholdMember: vi.fn(),
    removeHouseholdMember: vi.fn(),
    getHouseholdSettings: vi.fn(),
    updateHouseholdSettings: vi.fn(),
    transferRecipe: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import {
  useHouseholds,
  useCurrentUser,
  useHousehold,
  useHouseholdMembers,
  useHouseholdSettings,
  useCreateHousehold,
  useRenameHousehold,
  useAddMember,
  useRemoveMember,
  useUpdateHouseholdSettings,
  useTransferRecipe,
} from '@/lib/hooks/use-admin';

const mockApi = vi.mocked(api);

describe('useHouseholds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getHouseholds.mockResolvedValue([{ id: 'h1', name: 'Test', created_by: 'test@example.com' }]);
  });

  it('fetches households when enabled is true', async () => {
    const { result } = renderHook(
      () => useHouseholds({ enabled: true }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getHouseholds).toHaveBeenCalledTimes(1);
  });

  it('fetches households when no options provided (default enabled)', async () => {
    const { result } = renderHook(
      () => useHouseholds(),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getHouseholds).toHaveBeenCalledTimes(1);
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
    expect(mockApi.getHouseholds).not.toHaveBeenCalled();
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
    expect(mockApi.getHouseholds).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});

describe('useCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getCurrentUser.mockResolvedValue({
      uid: 'test',
      email: 'test@example.com',
      role: 'member',
      household_id: 'h1',
    });
  });

  it('fetches the current user', async () => {
    const { result } = renderHook(
      () => useCurrentUser(),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.email).toBe('test@example.com');
  });

  it('does NOT fetch when enabled is false', async () => {
    const { result } = renderHook(
      () => useCurrentUser({ enabled: false }),
      { wrapper: createQueryWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockApi.getCurrentUser).not.toHaveBeenCalled();
  });
});

describe('useHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getHousehold.mockResolvedValue({ id: 'h1', name: 'Test House', created_by: 'test@example.com' });
  });

  it('fetches a household by ID', async () => {
    const { result } = renderHook(
      () => useHousehold('h1'),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getHousehold).toHaveBeenCalledWith('h1');
  });
});

describe('useHouseholdMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getHouseholdMembers.mockResolvedValue([
      { email: 'a@test.com', role: 'admin', household_id: 'h1', display_name: null },
    ]);
  });

  it('fetches household members', async () => {
    const { result } = renderHook(
      () => useHouseholdMembers('h1'),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getHouseholdMembers).toHaveBeenCalledWith('h1');
  });
});

describe('useHouseholdSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getHouseholdSettings.mockResolvedValue({
      household_size: 4,
      default_servings: 4,
      language: 'sv',
      dietary: { lactose_free: false, seafood_ok: true, meat: 'all', minced_meat: 'meat', dairy: 'regular' },
      equipment: ['convection_oven'],
    });
  });

  it('fetches household settings', async () => {
    const { result } = renderHook(
      () => useHouseholdSettings('h1'),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getHouseholdSettings).toHaveBeenCalledWith('h1');
  });
});

describe('useCreateHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.createHousehold.mockResolvedValue({ id: 'new-h', name: 'New House', created_by: 'test@example.com' });
  });

  it('creates a household', async () => {
    const { result } = renderHook(
      () => useCreateHousehold(),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({ name: 'New House' });
    });

    expect(mockApi.createHousehold).toHaveBeenCalledWith({ name: 'New House' });
  });
});

describe('useRenameHousehold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.renameHousehold.mockResolvedValue({ id: 'h1', name: 'Renamed House', created_by: 'test@example.com' });
  });

  it('renames a household', async () => {
    const { result } = renderHook(
      () => useRenameHousehold(),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({ id: 'h1', name: 'Renamed House' });
    });

    expect(mockApi.renameHousehold).toHaveBeenCalledWith('h1', 'Renamed House');
  });

  it('handles error when rename fails', async () => {
    mockApi.renameHousehold.mockRejectedValue(new Error('Rename failed'));

    const { result } = renderHook(
      () => useRenameHousehold(),
      { wrapper: createQueryWrapper() },
    );

    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 'h1', name: 'Bad Name' });
      }),
    ).rejects.toThrow('Rename failed');
  });
});

describe('useAddMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.addHouseholdMember.mockResolvedValue({
      email: 'new@test.com',
      role: 'member',
      household_id: 'h1',
      display_name: null,
    });
  });

  it('adds a member to a household', async () => {
    const { result } = renderHook(
      () => useAddMember(),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({
        householdId: 'h1',
        data: { email: 'new@test.com', role: 'member' },
      });
    });

    expect(mockApi.addHouseholdMember).toHaveBeenCalledWith('h1', {
      email: 'new@test.com',
      role: 'member',
    });
  });
});

describe('useRemoveMember', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.removeHouseholdMember.mockResolvedValue(undefined);
  });

  it('removes a member from a household', async () => {
    const { result } = renderHook(
      () => useRemoveMember(),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({
        householdId: 'h1',
        email: 'remove@test.com',
      });
    });

    expect(mockApi.removeHouseholdMember).toHaveBeenCalledWith(
      'h1',
      'remove@test.com',
    );
  });
});

describe('useUpdateHouseholdSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.updateHouseholdSettings.mockResolvedValue({
      household_size: 6,
      default_servings: 4,
      language: 'en',
      dietary: { lactose_free: false, seafood_ok: true, meat: 'all', minced_meat: 'meat', dairy: 'regular' },
      equipment: ['convection_oven'],
    });
  });

  it('updates household settings', async () => {
    const { result } = renderHook(
      () => useUpdateHouseholdSettings(),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({
        householdId: 'h1',
        settings: { household_size: 6 },
      });
    });

    expect(mockApi.updateHouseholdSettings).toHaveBeenCalledWith('h1', {
      household_size: 6,
    });
  });
});

describe('useTransferRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.transferRecipe.mockResolvedValue({
      id: 'r1',
      title: 'Pasta',
      household_id: 'h2',
      message: 'Transferred',
    });
  });

  it('transfers a recipe to another household', async () => {
    const { result } = renderHook(
      () => useTransferRecipe(),
      { wrapper: createQueryWrapper() },
    );

    await act(async () => {
      await result.current.mutateAsync({
        recipeId: 'r1',
        targetHouseholdId: 'h2',
      });
    });

    expect(mockApi.transferRecipe).toHaveBeenCalledWith('r1', 'h2');
  });
});
