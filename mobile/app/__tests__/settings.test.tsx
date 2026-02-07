/**
 * Tests for Settings screen — verifies household settings navigation.
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
    it('navigates with household_id in URL when user has a household', async () => {
      mockCurrentUserData = {
        uid: 'user-1',
        email: 'test@example.com',
        role: 'member',
        household_id: 'household-abc',
        household_name: 'Test House',
      };

      // Dynamic import after mocks are set up
      const { default: SettingsScreen } = await import('@/app/(tabs)/settings');
      const Wrapper = createQueryWrapper();

      render(
        React.createElement(Wrapper, null,
          React.createElement(SettingsScreen)
        ),
      );

      // Find and press the household settings button
      const householdButton = screen.getByText('Household Settings');
      fireEvent.click(householdButton);

      // The critical assertion: router.push must include ?id= with the household ID
      expect(mockPush).toHaveBeenCalledWith(
        '/household-settings?id=household-abc',
      );
    });

    it('includes the correct household_id, not a hardcoded value', async () => {
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

      fireEvent.click(screen.getByText('Household Settings'));

      expect(mockPush).toHaveBeenCalledWith(
        '/household-settings?id=different-household-xyz',
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

      // Button should be disabled — pressing it should not call router.push
      const householdButton = screen.getByText('Household Settings');
      fireEvent.click(householdButton);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
