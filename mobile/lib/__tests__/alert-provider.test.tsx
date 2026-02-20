/**
 * Tests for AlertProvider — verifies queue management, context, and dismiss.
 *
 * Real logic tested:
 * - useAlert hook returns showAlert from provider context
 * - Alerts are queued and shown one at a time
 * - Dismissing an alert calls button.onPress and shows the next alert
 * - handleDismiss removes the current alert from the queue
 */

import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.unmock('@/lib/alert-context');

import {
  AlertProvider,
  useAlert,
  type AlertButton,
  type AlertRequest,
} from '@/lib/alert-context';

const createWrapper = (
  renderAlert: (
    alert: AlertRequest | null,
    onDismiss: (button?: AlertButton) => void,
  ) => ReactNode,
) => {
  return ({ children }: { children: ReactNode }) => (
    <AlertProvider renderAlert={renderAlert}>{children}</AlertProvider>
  );
};

describe('AlertProvider', () => {
  it('provides showAlert via useAlert hook', () => {
    const renderAlert = vi.fn().mockReturnValue(null);
    const { result } = renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    expect(result.current.showAlert).toBeTypeOf('function');
  });

  it('passes current alert to renderAlert', () => {
    const renderAlert = vi.fn().mockReturnValue(null);
    const { result } = renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    act(() => {
      result.current.showAlert('Title', 'Message', [{ text: 'OK' }]);
    });

    const lastCall = renderAlert.mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual({
      title: 'Title',
      message: 'Message',
      buttons: [{ text: 'OK' }],
    });
  });

  it('passes null when queue is empty', () => {
    const renderAlert = vi.fn().mockReturnValue(null);
    renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    const firstCall = renderAlert.mock.calls[0];
    expect(firstCall?.[0]).toBeNull();
  });

  it('shows alerts one at a time (queue)', () => {
    const renderAlert = vi.fn().mockReturnValue(null);
    const { result } = renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    act(() => {
      result.current.showAlert('First');
      result.current.showAlert('Second');
    });

    const lastCall = renderAlert.mock.calls.at(-1);
    expect(lastCall?.[0]?.title).toBe('First');
  });

  it('dismissing advances to next alert in queue', () => {
    let capturedDismiss: ((button?: AlertButton) => void) | null = null;
    const renderAlert = vi
      .fn()
      .mockImplementation(
        (
          _alert: AlertRequest | null,
          onDismiss: (button?: AlertButton) => void,
        ) => {
          capturedDismiss = onDismiss;
          return null;
        },
      );

    const { result } = renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    act(() => {
      result.current.showAlert('First');
      result.current.showAlert('Second');
    });

    act(() => {
      capturedDismiss?.();
    });

    const lastCall = renderAlert.mock.calls.at(-1);
    expect(lastCall?.[0]?.title).toBe('Second');
  });

  it('handleDismiss calls button.onPress', () => {
    let capturedDismiss: ((button?: AlertButton) => void) | null = null;
    const renderAlert = vi
      .fn()
      .mockImplementation(
        (
          _alert: AlertRequest | null,
          onDismiss: (button?: AlertButton) => void,
        ) => {
          capturedDismiss = onDismiss;
          return null;
        },
      );

    const { result } = renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    const onPress = vi.fn();
    act(() => {
      result.current.showAlert('Delete?', 'Sure?', [
        { text: 'OK', onPress },
      ]);
    });

    act(() => {
      capturedDismiss?.({ text: 'OK', onPress });
    });

    expect(onPress).toHaveBeenCalledOnce();
  });

  it('queue is empty after dismissing last alert', () => {
    let capturedDismiss: ((button?: AlertButton) => void) | null = null;
    const renderAlert = vi
      .fn()
      .mockImplementation(
        (
          _alert: AlertRequest | null,
          onDismiss: (button?: AlertButton) => void,
        ) => {
          capturedDismiss = onDismiss;
          return null;
        },
      );

    const { result } = renderHook(() => useAlert(), {
      wrapper: createWrapper(renderAlert),
    });

    act(() => {
      result.current.showAlert('Only one');
    });

    act(() => {
      capturedDismiss?.();
    });

    const lastCall = renderAlert.mock.calls.at(-1);
    expect(lastCall?.[0]).toBeNull();
  });
});
