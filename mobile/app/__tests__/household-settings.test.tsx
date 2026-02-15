/**
 * Tests for Household Settings screen — verifies role-based read-only mode.
 *
 * Bug caught: The household settings page allowed all users (including regular members)
 * to edit settings, but the API correctly blocked PUT requests for non-admin users with 403.
 * This gave a confusing UX where members could freely edit, then get an error on save.
 * The fix makes the entire page read-only for non-admin members.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { createQueryWrapper, mockCurrentUser } from '@/test/helpers';

// Control what useLocalSearchParams returns
const mockSearchParams = { id: 'household-abc' };
vi.mock('expo-router', async () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useLocalSearchParams: () => mockSearchParams,
  Stack: { Screen: ({ options }: any) => {
    // Render headerRight so we can test Save button visibility
    const headerRight = options?.headerRight;
    return headerRight ? React.createElement('div', { 'data-testid': 'header-right' }, headerRight()) : null;
  }},
}));

// Controllable mocks for admin hooks
let mockCurrentUserData: any = null;
let mockCurrentUserLoading = false;
const mockMutateAsync = vi.fn().mockResolvedValue({});
const mockUseHouseholdSettings = vi.fn().mockReturnValue({ data: null, isLoading: false });
const mockSettingsData = {
  household_size: 4,
  default_servings: 4,
  language: 'sv',
  dietary: {
    seafood_ok: true,
    meat: 'none' as const,
    meat_portions: 0,
    minced_meat: 'meat' as const,
    dairy: 'regular' as const,
    chicken_alternative: 'tofu',
    meat_alternative: 'tempeh',
  },
  equipment: ['air_fryer', 'convection_oven', 'grill_function'],
};

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' }, signOut: vi.fn() }),
}));

vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: () => ({ data: mockCurrentUserData, isLoading: mockCurrentUserLoading }),
  useHousehold: () => ({ data: { id: 'household-abc', name: 'Test Household', created_by: 'test@example.com' } }),
  useHouseholdSettings: (...args: any[]) => mockUseHouseholdSettings(...args),
  useUpdateHouseholdSettings: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useRenameHousehold: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useHouseholdMembers: () => ({ data: [], isLoading: false, refetch: vi.fn() }),
  useAddMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemoveMember: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

async function renderScreen() {
  const { default: HouseholdSettingsScreen } = await import('@/app/household-settings');
  const Wrapper = createQueryWrapper();
  return render(
    React.createElement(Wrapper, null,
      React.createElement(HouseholdSettingsScreen)
    ),
  );
}

describe('Household Settings screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUserLoading = false;
    mockUseHouseholdSettings.mockReturnValue({ data: mockSettingsData, isLoading: false });
  });

  describe('when user is a regular member', () => {
    beforeEach(() => {
      mockCurrentUserData = mockCurrentUser({
        role: 'member',
        household_id: 'household-abc',
      });
    });

    it('shows read-only banner', async () => {
      await renderScreen();
      expect(
        screen.getByText('Only admins can change settings'),
      ).toBeTruthy();
    });

    it('does not show Save button in header', async () => {
      await renderScreen();
      const headerRight = screen.queryByTestId('header-right');
      // Header right should be null or render nothing
      if (headerRight) {
        expect(headerRight.children.length).toBe(0);
      }
    });

    it('disables all switches', async () => {
      await renderScreen();
      const switches = screen.getAllByRole('switch');
      for (const sw of switches) {
        expect((sw as HTMLInputElement).disabled).toBe(true);
      }
    });

    it('disables all settings text inputs', async () => {
      await renderScreen();
      const inputs = screen.queryAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
      // Items-at-home input remains interactive for all household members
      const settingsInputs = inputs.filter(
        (el) => !(el as HTMLInputElement).placeholder?.includes('salt'),
      );
      expect(settingsInputs.length).toBeGreaterThan(0);
      for (const input of settingsInputs) {
        expect((input as HTMLInputElement).disabled).toBe(true);
      }
    });

    it('disables +/- buttons for household size and servings', async () => {
      await renderScreen();
      const allButtons = screen.getAllByRole('button');
      const disabledButtons = allButtons.filter((btn) => (btn as HTMLButtonElement).disabled);
      // At least 4 disabled buttons: 2 for household_size, 2 for default_servings
      expect(disabledButtons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('when user is a household admin', () => {
    beforeEach(() => {
      mockCurrentUserData = mockCurrentUser({
        role: 'admin',
        household_id: 'household-abc',
      });
    });

    it('does not show read-only banner', async () => {
      await renderScreen();
      expect(
        screen.queryByText('Only household admins can change these settings.'),
      ).toBeNull();
    });

    it('shows Save button after making changes', async () => {
      await renderScreen();
      // Save button only appears when there are changes
      expect(screen.queryByText('Save')).toBeNull();
      // Make a change
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);
      // Now Save should appear
      expect(screen.getByText('Save')).toBeTruthy();
    });

    it('enables switches', async () => {
      await renderScreen();
      const switches = screen.getAllByRole('switch');
      for (const sw of switches) {
        expect((sw as HTMLInputElement).disabled).toBe(false);
      }
    });

    it('enables text inputs', async () => {
      await renderScreen();
      const inputs = screen.getAllByRole('textbox');
      for (const input of inputs) {
        expect((input as HTMLInputElement).disabled).toBe(false);
      }
    });
  });

  describe('when user is a superuser', () => {
    beforeEach(() => {
      mockCurrentUserData = mockCurrentUser({
        role: 'superuser',
        household_id: 'other-household',
      });
    });

    it('does not show read-only banner', async () => {
      await renderScreen();
      expect(
        screen.queryByText('Only household admins can change these settings.'),
      ).toBeNull();
    });

    it('shows Save button after making changes (even for non-own household)', async () => {
      await renderScreen();
      // Save button only appears when there are changes
      expect(screen.queryByText('Save')).toBeNull();
      // Make a change
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);
      // Now Save should appear
      expect(screen.getByText('Save')).toBeTruthy();
    });

    it('enables all controls', async () => {
      await renderScreen();
      const switches = screen.getAllByRole('switch');
      for (const sw of switches) {
        expect((sw as HTMLInputElement).disabled).toBe(false);
      }
    });
  });

  describe('edge case: admin of different household', () => {
    beforeEach(() => {
      mockCurrentUserData = mockCurrentUser({
        role: 'admin',
        household_id: 'other-household-xyz',
      });
    });

    it('shows read-only banner (admin of a different household)', async () => {
      await renderScreen();
      expect(
        screen.getByText('Only admins can change settings'),
      ).toBeTruthy();
    });
  });

  describe('admin interactions', () => {
    beforeEach(() => {
      mockCurrentUserData = mockCurrentUser({
        role: 'admin',
        household_id: 'household-abc',
      });
      mockMutateAsync.mockClear();
    });

    it('can toggle a switch to change equipment settings', async () => {
      await renderScreen();
      const switches = screen.getAllByRole('switch');
      // Toggle the first switch — exercises updateEquipment/updateDietary code paths
      fireEvent.click(switches[0]);
      expect(switches.length).toBeGreaterThan(0);
    });

    it('calls mutateAsync when Save is pressed after making changes', async () => {
      await renderScreen();

      // Toggle a switch to set hasChanges=true
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);

      // Click Save
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          householdId: 'household-abc',
          settings: expect.objectContaining({
            household_size: 4,
            default_servings: 4,
          }),
        });
      });
    });

    it('shows increment/decrement buttons for number fields', async () => {
      await renderScreen();
      // There should be +/- buttons for household_size and default_servings
      const allButtons = screen.getAllByRole('button');
      const enabledButtons = allButtons.filter(
        (btn) => !(btn as HTMLButtonElement).disabled,
      );
      // At least save + back + 4 increment/decrement buttons
      expect(enabledButtons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('no route param for household ID', () => {
    beforeEach(() => {
      Object.assign(mockSearchParams, { id: undefined });
    });

    afterEach(() => {
      Object.assign(mockSearchParams, { id: 'household-abc' });
    });

    it('shows spinner while user is still loading', async () => {
      mockCurrentUserData = null;
      mockCurrentUserLoading = true;
      await renderScreen();
      expect(screen.queryByText('Invalid household ID')).toBeNull();
    });

    it('falls back to currentUser.household_id', async () => {
      mockCurrentUserData = mockCurrentUser({
        role: 'admin',
        household_id: 'user-household-xyz',
      });
      await renderScreen();
      expect(mockUseHouseholdSettings).toHaveBeenCalledWith('user-household-xyz');
      expect(screen.queryByText('Invalid household ID')).toBeNull();
    });

    it('shows invalid household ID when user has no household', async () => {
      mockCurrentUserData = mockCurrentUser({ role: 'admin', household_id: undefined as any });
      await renderScreen();
      expect(screen.getByText('Invalid household ID')).toBeTruthy();
    });
  });
});
