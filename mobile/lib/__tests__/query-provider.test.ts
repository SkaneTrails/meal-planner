import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it } from 'vitest';

import { persistQueryCache, queryClient } from '@/lib/query-provider';

describe('persistQueryCache', () => {
  beforeEach(() => queryClient.clear());

  it('skips online-only queries but keeps store order', async () => {
    queryClient.setQueryData(['meal-plans', 'detail'], { meals: {} });
    queryClient.setQueryData(['grocery', { days: 7 }], { items: [] });
    queryClient.setQueryData(['grocery', 'storeOrder', 's1'], { order: [] });

    await persistQueryCache();

    const raw = await AsyncStorage.getItem('meal-planner-query-cache');
    const keys = JSON.parse(raw as string).map(
      (q: { queryKey: unknown[] }) => q.queryKey,
    );
    expect(keys).toEqual([['grocery', 'storeOrder', 's1']]);
  });
});
