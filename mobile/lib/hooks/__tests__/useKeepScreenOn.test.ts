import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from 'expo-keep-awake';
import { useKeepScreenOn } from '../useKeepScreenOn';

const mockActivate = vi.mocked(activateKeepAwakeAsync);
const mockDeactivate = vi.mocked(deactivateKeepAwake);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useKeepScreenOn', () => {
  it('activates keep-awake when enabled', () => {
    renderHook(() => useKeepScreenOn(true));
    expect(mockActivate).toHaveBeenCalledWith('recipe-detail');
    expect(mockDeactivate).not.toHaveBeenCalled();
  });

  it('does not call activate or deactivate when disabled on mount', () => {
    renderHook(() => useKeepScreenOn(false));
    expect(mockActivate).not.toHaveBeenCalled();
    expect(mockDeactivate).not.toHaveBeenCalled();
  });

  it('deactivates on unmount when active', () => {
    const { unmount } = renderHook(() => useKeepScreenOn(true));
    vi.clearAllMocks();
    unmount();
    expect(mockDeactivate).toHaveBeenCalledWith('recipe-detail');
  });

  it('does not deactivate on unmount when never activated', () => {
    const { unmount } = renderHook(() => useKeepScreenOn(false));
    unmount();
    expect(mockDeactivate).not.toHaveBeenCalled();
  });

  it('toggles when isEnabled changes', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useKeepScreenOn(enabled),
      { initialProps: { enabled: false } },
    );
    expect(mockActivate).not.toHaveBeenCalled();

    rerender({ enabled: true });
    expect(mockActivate).toHaveBeenCalledWith('recipe-detail');
  });

  it('deactivates when toggled off after being on', () => {
    const { rerender } = renderHook(
      ({ enabled }) => useKeepScreenOn(enabled),
      { initialProps: { enabled: true } },
    );
    vi.clearAllMocks();

    rerender({ enabled: false });
    expect(mockDeactivate).toHaveBeenCalledWith('recipe-detail');
  });
});
