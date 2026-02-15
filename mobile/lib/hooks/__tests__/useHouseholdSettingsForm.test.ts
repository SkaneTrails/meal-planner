import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryWrapper } from '@/test/helpers';
import type { HouseholdMember } from '@/lib/types';

const mockMutateAsyncUpdateSettings = vi.fn().mockResolvedValue(undefined);
const mockMutateAsyncRename = vi.fn().mockResolvedValue(undefined);
const mockMutateAsyncAddMember = vi.fn().mockResolvedValue(undefined);
const mockMutateAsyncRemoveMember = vi.fn().mockResolvedValue(undefined);
const mockRefetchMembers = vi.fn();

const { DEFAULT_SETTINGS } = vi.hoisted(() => ({
  DEFAULT_SETTINGS: {
    dietary: { lactose_free: false, vegetarian_percentage: 0 },
    default_servings: 4,
    equipment: [],
  },
}));

vi.mock('@/components/household-settings', () => ({
  DEFAULT_SETTINGS,
}));

let mockRemoteSettings: Record<string, unknown> | undefined = undefined;
let mockMembers: HouseholdMember[] = [];
let mockHousehold: { name: string } | undefined = { name: 'Test Household' };
let mockCurrentUser: Record<string, unknown> | undefined = {
  role: 'admin',
  household_id: 'h1',
};

vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: vi.fn(() => ({
    data: mockCurrentUser,
    isLoading: false,
  })),
  useHouseholdSettings: vi.fn(() => ({
    data: mockRemoteSettings,
    isLoading: false,
  })),
  useUpdateHouseholdSettings: vi.fn(() => ({
    mutateAsync: mockMutateAsyncUpdateSettings,
    isPending: false,
  })),
  useHouseholdMembers: vi.fn(() => ({
    data: mockMembers,
    isLoading: false,
    refetch: mockRefetchMembers,
  })),
  useAddMember: vi.fn(() => ({
    mutateAsync: mockMutateAsyncAddMember,
    isPending: false,
  })),
  useRemoveMember: vi.fn(() => ({
    mutateAsync: mockMutateAsyncRemoveMember,
  })),
  useHousehold: vi.fn(() => ({ data: mockHousehold })),
  useRenameHousehold: vi.fn(() => ({
    mutateAsync: mockMutateAsyncRename,
    isPending: false,
  })),
}));

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({ user: { email: 'admin@test.com' } })),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key, language: 'en' }),
}));

const mockShowAlert = vi.fn();
const mockShowNotification = vi.fn();
vi.mock('@/lib/alert', () => ({
  showAlert: (...args: unknown[]) => mockShowAlert(...args),
  showNotification: (...args: unknown[]) => mockShowNotification(...args),
}));

import { useHouseholdSettingsForm } from '../useHouseholdSettingsForm';

describe('useHouseholdSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoteSettings = undefined;
    mockMembers = [];
    mockHousehold = { name: 'Test Household' };
    mockCurrentUser = { role: 'admin', household_id: 'h1' };
  });

  const render = (paramId?: string) =>
    renderHook(() => useHouseholdSettingsForm(paramId), {
      wrapper: createQueryWrapper(),
    });

  describe('canEdit', () => {
    it('returns true for admin of same household', () => {
      const { result } = render('h1');
      expect(result.current.canEdit).toBe(true);
    });

    it('returns false for admin of different household', () => {
      mockCurrentUser = { role: 'admin', household_id: 'other' };
      const { result } = render('h1');
      expect(result.current.canEdit).toBe(false);
    });

    it('returns true for superuser regardless of household', () => {
      mockCurrentUser = { role: 'superuser', household_id: 'other' };
      const { result } = render('h1');
      expect(result.current.canEdit).toBe(true);
    });

    it('returns false for member role', () => {
      mockCurrentUser = { role: 'member', household_id: 'h1' };
      const { result } = render('h1');
      expect(result.current.canEdit).toBe(false);
    });
  });

  describe('settings state', () => {
    it('initializes with defaults when no remote settings', () => {
      const { result } = render('h1');
      expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
      expect(result.current.hasChanges).toBe(false);
    });

    it('merges remote settings with defaults', () => {
      mockRemoteSettings = {
        dietary: { lactose_free: true },
        default_servings: 6,
        equipment: ['airfryer'],
      };
      const { result } = render('h1');
      expect(result.current.settings.dietary.lactose_free).toBe(true);
      expect(result.current.settings.default_servings).toBe(6);
      expect(result.current.settings.equipment).toEqual(['airfryer']);
    });

    it('handles non-array equipment in remote settings', () => {
      mockRemoteSettings = { equipment: 'invalid' };
      const { result } = render('h1');
      expect(result.current.settings.equipment).toEqual([]);
    });
  });

  describe('updateDietary', () => {
    it('updates a dietary setting and marks changes', () => {
      const { result } = render('h1');
      act(() => result.current.updateDietary('lactose_free', true));
      expect(result.current.settings.dietary.lactose_free).toBe(true);
      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('updateServings', () => {
    it('updates servings and marks changes', () => {
      const { result } = render('h1');
      act(() => result.current.updateServings(6));
      expect(result.current.settings.default_servings).toBe(6);
      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('toggleEquipment', () => {
    it('adds equipment when not present', () => {
      const { result } = render('h1');
      act(() => result.current.toggleEquipment('airfryer'));
      expect(result.current.settings.equipment).toContain('airfryer');
      expect(result.current.hasChanges).toBe(true);
    });

    it('removes equipment when already present', () => {
      mockRemoteSettings = { equipment: ['airfryer'] };
      const { result } = render('h1');
      act(() => result.current.toggleEquipment('airfryer'));
      expect(result.current.settings.equipment).not.toContain('airfryer');
    });
  });

  describe('handleSave', () => {
    it('saves settings and shows notification on success', async () => {
      const { result } = render('h1');
      act(() => result.current.updateServings(6));
      await act(() => result.current.handleSave());
      expect(mockMutateAsyncUpdateSettings).toHaveBeenCalledWith({
        householdId: 'h1',
        settings: expect.objectContaining({ default_servings: 6 }),
      });
      expect(result.current.hasChanges).toBe(false);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'householdSettings.saved',
        'householdSettings.savedMessage',
      );
    });

    it('shows error notification on failure', async () => {
      mockMutateAsyncUpdateSettings.mockRejectedValueOnce(new Error('Network'));
      const { result } = render('h1');
      await act(() => result.current.handleSave());
      expect(mockShowNotification).toHaveBeenCalledWith(
        'common.error',
        'householdSettings.failedToSave',
      );
    });

    it('does nothing when householdId is undefined', async () => {
      mockCurrentUser = undefined;
      const { result } = render(undefined);
      await act(() => result.current.handleSave());
      expect(mockMutateAsyncUpdateSettings).not.toHaveBeenCalled();
    });
  });

  describe('handleStartEditName / handleSaveName', () => {
    it('sets editing mode with current household name', () => {
      const { result } = render('h1');
      act(() => result.current.handleStartEditName());
      expect(result.current.isEditingName).toBe(true);
      expect(result.current.editedName).toBe('Test Household');
    });

    it('saves new name on submit', async () => {
      const { result } = render('h1');
      act(() => result.current.handleStartEditName());
      act(() => result.current.setEditedName('New Name'));
      await act(() => result.current.handleSaveName());
      expect(mockMutateAsyncRename).toHaveBeenCalledWith({
        id: 'h1',
        name: 'New Name',
      });
      expect(result.current.isEditingName).toBe(false);
    });

    it('does not save if name is unchanged', async () => {
      const { result } = render('h1');
      act(() => result.current.handleStartEditName());
      // editedName is already 'Test Household' which equals household.name
      await act(() => result.current.handleSaveName());
      expect(mockMutateAsyncRename).not.toHaveBeenCalled();
    });

    it('does not save if name is empty after trim', async () => {
      const { result } = render('h1');
      act(() => result.current.handleStartEditName());
      act(() => result.current.setEditedName('   '));
      await act(() => result.current.handleSaveName());
      expect(mockMutateAsyncRename).not.toHaveBeenCalled();
    });

    it('shows error if rename fails', async () => {
      mockMutateAsyncRename.mockRejectedValueOnce(new Error('Name taken'));
      const { result } = render('h1');
      act(() => result.current.handleStartEditName());
      act(() => result.current.setEditedName('Duplicate'));
      await act(() => result.current.handleSaveName());
      expect(mockShowNotification).toHaveBeenCalledWith(
        'common.error',
        'Name taken',
      );
    });

    it('cancelEditName resets editing state', () => {
      const { result } = render('h1');
      act(() => result.current.handleStartEditName());
      expect(result.current.isEditingName).toBe(true);
      act(() => result.current.cancelEditName());
      expect(result.current.isEditingName).toBe(false);
    });
  });

  describe('handleAddMember', () => {
    it('adds member and resets state', async () => {
      const { result } = render('h1');
      act(() => result.current.setNewMemberEmail('new@test.com'));
      await act(() => result.current.handleAddMember());
      expect(mockMutateAsyncAddMember).toHaveBeenCalledWith({
        householdId: 'h1',
        data: { email: 'new@test.com', role: 'member' },
      });
      expect(result.current.newMemberEmail).toBe('');
      expect(result.current.newMemberRole).toBe('member');
      expect(mockRefetchMembers).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('settings.memberAdded');
    });

    it('does nothing when email is empty', async () => {
      const { result } = render('h1');
      await act(() => result.current.handleAddMember());
      expect(mockMutateAsyncAddMember).not.toHaveBeenCalled();
    });

    it('shows error when add fails', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockMutateAsyncAddMember.mockRejectedValueOnce(new Error('exists'));
      const { result } = render('h1');
      act(() => result.current.setNewMemberEmail('dup@test.com'));
      await act(() => result.current.handleAddMember());
      expect(mockShowNotification).toHaveBeenCalledWith(
        'common.error',
        'admin.failedToAddMember',
      );
      spy.mockRestore();
    });
  });

  describe('handleRemoveMember', () => {
    it('prevents removing self', () => {
      const { result } = render('h1');
      act(() =>
        result.current.handleRemoveMember({
          email: 'admin@test.com',
          role: 'admin',
        } as HouseholdMember),
      );
      expect(mockShowNotification).toHaveBeenCalledWith(
        'common.error',
        'settings.cannotRemoveSelf',
      );
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('shows confirmation dialog for other members', () => {
      const { result } = render('h1');
      act(() =>
        result.current.handleRemoveMember({
          email: 'other@test.com',
          display_name: 'Other User',
          role: 'member',
        } as HouseholdMember),
      );
      expect(mockShowAlert).toHaveBeenCalledWith(
        'admin.removeMember',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel' }),
          expect.objectContaining({ text: 'common.remove', style: 'destructive' }),
        ]),
      );
    });

    it('removes member when confirm action is pressed', async () => {
      const { result } = render('h1');
      act(() =>
        result.current.handleRemoveMember({
          email: 'other@test.com',
          role: 'member',
        } as HouseholdMember),
      );
      // Get the destructive button's onPress
      const buttons = mockShowAlert.mock.calls[0][2];
      const removeButton = buttons.find(
        (b: { text: string }) => b.text === 'common.remove',
      );
      await act(() => removeButton.onPress());
      expect(mockMutateAsyncRemoveMember).toHaveBeenCalledWith({
        householdId: 'h1',
        email: 'other@test.com',
      });
      expect(mockRefetchMembers).toHaveBeenCalled();
    });

    it('shows error when removal fails in confirm callback', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockMutateAsyncRemoveMember.mockRejectedValueOnce(new Error('fail'));
      const { result } = render('h1');
      act(() =>
        result.current.handleRemoveMember({
          email: 'other@test.com',
          role: 'member',
        } as HouseholdMember),
      );
      const buttons = mockShowAlert.mock.calls[0][2];
      const removeButton = buttons.find(
        (b: { text: string }) => b.text === 'common.remove',
      );
      await act(() => removeButton.onPress());
      expect(mockShowNotification).toHaveBeenCalledWith(
        'common.error',
        'admin.failedToRemoveMember',
      );
      spy.mockRestore();
    });
  });

  describe('householdId resolution', () => {
    it('uses paramId when provided', () => {
      const { result } = render('custom-id');
      expect(result.current.householdId).toBe('custom-id');
    });

    it('falls back to currentUser householdId when no paramId', () => {
      const { result } = render(undefined);
      expect(result.current.householdId).toBe('h1');
    });
  });
});
