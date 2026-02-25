/**
 * Tests for Settings screen — verifies navigation to household/AI detail screens.
 *
 * Bug caught: The settings page originally navigated to `/household-settings`
 * without passing `?id=` query parameter, causing "Invalid household ID" error.
 * The fix passes `currentUser.household_id` in the URL.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { createQueryWrapper } from '@/test/helpers';

// Track router.push calls
const mockPush = vi.fn();
vi.mock('expo-router', async () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn(), replace: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
  Link: ({ children }: any) => children,
}));

// Mock useCurrentUser with controllable return value
let mockCurrentUserData: any = null;
vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: () => ({ data: mockCurrentUserData, isLoading: false }),
  useUpdateHouseholdSettings: () => ({ mutateAsync: vi.fn() }),
  useHouseholdSettings: () => ({ data: null }),
}));

describe('Settings screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUserData = null;
  });

  describe('household settings navigation', () => {
    it('navigates to Members section with household_id when user has a household', async () => {
      mockCurrentUserData = {
        uid: 'user-1',
        email: 'test@example.com',
        role: 'member',
        household_id: 'household-abc',
        household_name: 'Test House',
      };

      const { default: SettingsScreen } = await import('@/app/(tabs)/settings');
      const Wrapper = createQueryWrapper();

      render(
        React.createElement(Wrapper, null,
          React.createElement(SettingsScreen)
        ),
      );

      fireEvent.click(screen.getByText('Members'));

      expect(mockPush).toHaveBeenCalledWith(
        '/household-settings?id=household-abc&section=members',
      );
    });

    it('includes the correct household_id for each household nav item', async () => {
      mockCurrentUserData = {
        uid: 'user-2',
        email: 'other@example.com',
        role: 'admin',
        household_id: 'different-household-xyz',
        household_name: 'Other House',
      };

      const { default: SettingsScreen } = await import('@/app/(tabs)/settings');
      const Wrapper = createQueryWrapper();

      render(
        React.createElement(Wrapper, null,
          React.createElement(SettingsScreen)
        ),
      );

      fireEvent.click(screen.getByText('Members'));
      expect(mockPush).toHaveBeenCalledWith(
        '/household-settings?id=different-household-xyz&section=members',
      );
    });

    it('does not navigate when user has no household', async () => {
      mockCurrentUserData = {
        uid: 'user-3',
        email: 'lonely@example.com',
        role: 'member',
        household_id: null,
        household_name: undefined,
      };

      const { default: SettingsScreen } = await import('@/app/(tabs)/settings');
      const Wrapper = createQueryWrapper();

      render(
        React.createElement(Wrapper, null,
          React.createElement(SettingsScreen)
        ),
      );

      fireEvent.click(screen.getByText('Members'));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('AI settings navigation', () => {
    it('navigates to ai settings with household_id', async () => {
      mockCurrentUserData = {
        uid: 'user-1',
        email: 'test@example.com',
        role: 'member',
        household_id: 'household-abc',
        household_name: 'Test House',
      };

      const { default: SettingsScreen } = await import('@/app/(tabs)/settings');
      const Wrapper = createQueryWrapper();

      render(
        React.createElement(Wrapper, null,
          React.createElement(SettingsScreen)
        ),
      );

      fireEvent.click(screen.getByText('Configure how AI enhances your recipes'));

      expect(mockPush).toHaveBeenCalledWith(
        '/ai-settings?id=household-abc',
      );
    });
  });
});
