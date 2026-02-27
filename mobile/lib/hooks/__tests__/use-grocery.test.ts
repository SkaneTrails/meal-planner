/**
 * Tests for useGroceryList hook — verifies query key and fetch behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/test/helpers';

vi.mock('@/lib/api', () => ({
  api: {
    getGroceryList: vi.fn(),
    getStoreOrder: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import { useGroceryList, useStoreOrder } from '@/lib/hooks/use-grocery';

const mockApi = vi.mocked(api);

describe('useGroceryList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getGroceryList.mockResolvedValue({
      items: [
        {
          name: 'milk',
          quantity: '1L',
          unit: null,
          category: 'dairy',
          checked: false,
          recipe_sources: [],
          quantity_sources: [],
        },
      ],
    });
  });

  it('fetches the grocery list', async () => {
    const { result } = renderHook(() => useGroceryList(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getGroceryList).toHaveBeenCalledTimes(1);
  });

  it('passes options through to the query fn', async () => {
    const { result } = renderHook(
      () => useGroceryList({ days: 7 }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getGroceryList).toHaveBeenCalledWith({ days: 7 });
  });
});

describe('useStoreOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.getStoreOrder.mockResolvedValue({ item_order: ['milk', 'bread'] });
  });

  it('fetches store order when storeId is provided', async () => {
    const { result } = renderHook(() => useStoreOrder('store_1'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi.getStoreOrder).toHaveBeenCalledWith('store_1');
    expect(result.current.data?.item_order).toEqual(['milk', 'bread']);
  });

  it('does not fetch when storeId is null', () => {
    const { result } = renderHook(() => useStoreOrder(null), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockApi.getStoreOrder).not.toHaveBeenCalled();
  });
});
