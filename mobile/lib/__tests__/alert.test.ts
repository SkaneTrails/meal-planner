/**
 * Tests for alert utilities — verifies the themed in-app alert system.
 *
 * Real logic tested:
 * - showAlert: enqueues alerts via module-level ref (set by AlertProvider)
 * - showNotification: delegates to showAlert with single OK button
 * - showConfirm: returns a Promise<boolean> via cancel/OK buttons
 * - Fallback: window.alert when AlertProvider is not mounted
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Unmock both so we test the real implementation
vi.unmock('@/lib/alert');
vi.unmock('@/lib/alert-context');

import {
  showAlert,
  showNotification,
  showConfirm,
  setGlobalAlertRef,
} from '@/lib/alert-context';

describe('alert-context (no provider mounted)', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setGlobalAlertRef(null);
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('falls back to window.alert when no provider is registered', () => {
    showAlert('Title', 'Message');
    expect(alertSpy).toHaveBeenCalledWith('Title\n\nMessage');
  });

  it('falls back with title-only when no message provided', () => {
    showAlert('Title');
    expect(alertSpy).toHaveBeenCalledWith('Title');
  });
});

describe('alert-context (provider mounted)', () => {
  const mockEnqueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setGlobalAlertRef(mockEnqueue);
  });

  afterEach(() => {
    setGlobalAlertRef(null);
  });

  it('enqueues alert via global ref', () => {
    showAlert('Title', 'Message', [{ text: 'OK' }]);
    expect(mockEnqueue).toHaveBeenCalledWith('Title', 'Message', [
      { text: 'OK' },
    ]);
  });

  it('enqueues alert without buttons', () => {
    showAlert('Title', 'Msg');
    expect(mockEnqueue).toHaveBeenCalledWith('Title', 'Msg', undefined);
  });
});

describe('showNotification', () => {
  const mockEnqueue = vi.fn();

  beforeEach(() => {
    setGlobalAlertRef(mockEnqueue);
  });

  afterEach(() => {
    setGlobalAlertRef(null);
  });

  it('delegates to showAlert with single OK button', () => {
    showNotification('Done', 'Recipe saved');
    expect(mockEnqueue).toHaveBeenCalledWith('Done', 'Recipe saved', [
      { text: 'OK' },
    ]);
  });
});

describe('showConfirm', () => {
  it('resolves to true when OK button is pressed', async () => {
    setGlobalAlertRef((_title, _message, buttons) => {
      const ok = buttons?.find((b) => b.text === 'OK');
      ok?.onPress?.();
    });

    const result = await showConfirm('Delete?', 'Are you sure?');
    expect(result).toBe(true);
    setGlobalAlertRef(null);
  });

  it('resolves to false when Cancel button is pressed', async () => {
    setGlobalAlertRef((_title, _message, buttons) => {
      const cancel = buttons?.find((b) => b.style === 'cancel');
      cancel?.onPress?.();
    });

    const result = await showConfirm('Delete?', 'Are you sure?');
    expect(result).toBe(false);
    setGlobalAlertRef(null);
  });
});
