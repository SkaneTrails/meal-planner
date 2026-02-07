/**
 * Tests for alert utilities — verifies cross-platform behavior.
 *
 * Real logic tested:
 * - showAlert: web branch uses window.alert/confirm based on button count
 * - Button routing: cancel button → confirm(false), action button → confirm(true)
 * - showNotification: delegates to showAlert with single OK button
 * - showConfirm: returns a Promise<boolean> resolving to confirm/cancel result
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock react-native Platform to 'web' for testing the web branch
vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Platform: { OS: 'web' },
}));

// Unmock @/lib/alert so we test the real implementation
// (setup.ts has a global mock for it)
vi.unmock('@/lib/alert');

import { showAlert, showNotification, showConfirm } from '@/lib/alert';

describe('showAlert (web platform)', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  it('shows window.alert with no buttons', () => {
    showAlert('Title', 'Message');
    expect(alertSpy).toHaveBeenCalledWith('Title\n\nMessage');
  });

  it('shows window.alert with empty buttons array', () => {
    showAlert('Title', 'Message', []);
    expect(alertSpy).toHaveBeenCalledWith('Title\n\nMessage');
  });

  it('shows title-only when no message provided', () => {
    showAlert('Title');
    expect(alertSpy).toHaveBeenCalledWith('Title');
  });

  it('shows window.alert for single button', () => {
    showAlert('Title', 'Message', [{ text: 'OK' }]);
    expect(alertSpy).toHaveBeenCalledWith('Title\n\nMessage');
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('uses window.confirm for two buttons', () => {
    confirmSpy.mockReturnValue(true);
    const onAction = vi.fn();
    const onCancel = vi.fn();

    showAlert('Delete?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Delete', style: 'destructive', onPress: onAction },
    ]);

    expect(confirmSpy).toHaveBeenCalledWith('Delete?\n\nAre you sure?');
    expect(onAction).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls cancel button onPress when user cancels confirm', () => {
    confirmSpy.mockReturnValue(false);
    const onAction = vi.fn();
    const onCancel = vi.fn();

    showAlert('Delete?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Delete', onPress: onAction },
    ]);

    expect(onCancel).toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
  });

  it('falls back to first button if all are cancel-style', () => {
    confirmSpy.mockReturnValue(true);
    const onFirst = vi.fn();
    const onSecond = vi.fn();

    showAlert('Title', 'Msg', [
      { text: 'A', style: 'cancel', onPress: onFirst },
      { text: 'B', style: 'cancel', onPress: onSecond },
    ]);

    // When all buttons are cancel-style, the first one is used as the action button
    expect(onFirst).toHaveBeenCalled();
  });
});

describe('showNotification', () => {
  it('shows a simple alert', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    showNotification('Done', 'Recipe saved');
    expect(alertSpy).toHaveBeenCalledWith('Done\n\nRecipe saved');
    alertSpy.mockRestore();
  });
});

describe('showConfirm', () => {
  it('resolves to true when user confirms', async () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValue(true);

    const result = await showConfirm('Delete?', 'Are you sure?');
    expect(result).toBe(true);

    confirmSpy.mockRestore();
  });

  it('resolves to false when user cancels', async () => {
    const confirmSpy = vi
      .spyOn(window, 'confirm')
      .mockReturnValue(false);

    const result = await showConfirm('Delete?', 'Are you sure?');
    expect(result).toBe(false);

    confirmSpy.mockRestore();
  });
});
