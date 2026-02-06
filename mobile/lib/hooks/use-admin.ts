/**
 * React Query hooks for admin API endpoints.
 * Provides household and member management functionality.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type {
  CurrentUser,
  Household,
  HouseholdCreate,
  HouseholdMember,
  HouseholdSettings,
  MemberAdd,
} from '../types';

// Query keys
const adminKeys = {
  all: ['admin'] as const,
  currentUser: () => [...adminKeys.all, 'currentUser'] as const,
  households: () => [...adminKeys.all, 'households'] as const,
  household: (id: string) => [...adminKeys.all, 'household', id] as const,
  members: (householdId: string) =>
    [...adminKeys.all, 'members', householdId] as const,
  settings: (householdId: string) =>
    [...adminKeys.all, 'settings', householdId] as const,
};

/**
 * Get current user info including role and household.
 */
export function useCurrentUser(options?: { enabled?: boolean }) {
  return useQuery<CurrentUser>({
    queryKey: adminKeys.currentUser(),
    queryFn: () => api.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on 403
    enabled: options?.enabled ?? true,
  });
}

/**
 * Get all households (superuser only).
 */
export function useHouseholds() {
  return useQuery<Household[]>({
    queryKey: adminKeys.households(),
    queryFn: () => api.getHouseholds(),
    retry: false,
  });
}

/**
 * Get a specific household by ID.
 */
export function useHousehold(id: string) {
  return useQuery<Household>({
    queryKey: adminKeys.household(id),
    queryFn: () => api.getHousehold(id),
    enabled: Boolean(id),
  });
}

/**
 * Get members of a household.
 */
export function useHouseholdMembers(householdId: string) {
  return useQuery<HouseholdMember[]>({
    queryKey: adminKeys.members(householdId),
    queryFn: () => api.getHouseholdMembers(householdId),
    enabled: Boolean(householdId),
  });
}

/**
 * Create a new household.
 */
export function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation<Household, Error, HouseholdCreate>({
    mutationFn: (data) => api.createHousehold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.households() });
    },
  });
}

/**
 * Add a member to a household.
 */
export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation<
    HouseholdMember,
    Error,
    { householdId: string; data: MemberAdd }
  >({
    mutationFn: ({ householdId, data }) =>
      api.addHouseholdMember(householdId, data),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.members(householdId),
      });
    },
  });
}

/**
 * Remove a member from a household.
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { householdId: string; email: string }>({
    mutationFn: ({ householdId, email }) =>
      api.removeHouseholdMember(householdId, email),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.members(householdId),
      });
    },
  });
}

/**
 * Get household settings.
 */
export function useHouseholdSettings(householdId: string | null) {
  return useQuery<HouseholdSettings>({
    queryKey: adminKeys.settings(householdId ?? ''),
    queryFn: () => api.getHouseholdSettings(householdId!),
    enabled: !!householdId,
  });
}

/**
 * Update household settings.
 */
export function useUpdateHouseholdSettings() {
  const queryClient = useQueryClient();

  return useMutation<
    HouseholdSettings,
    Error,
    { householdId: string; settings: Partial<HouseholdSettings> }
  >({
    mutationFn: ({ householdId, settings }) =>
      api.updateHouseholdSettings(householdId, settings),
    onSuccess: (_, { householdId }) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.settings(householdId),
      });
    },
  });
}

/**
 * Transfer a recipe to a different household (superuser only).
 */
export function useTransferRecipe() {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string; title: string; household_id: string; message: string },
    Error,
    { recipeId: string; targetHouseholdId: string }
  >({
    mutationFn: ({ recipeId, targetHouseholdId }) =>
      api.transferRecipe(recipeId, targetHouseholdId),
    onSuccess: (_, { recipeId }) => {
      // Invalidate the recipe query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
