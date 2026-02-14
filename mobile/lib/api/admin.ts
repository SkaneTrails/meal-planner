/**
 * Admin API endpoints: users, households, members, settings, recipe transfer.
 */

import type {
  CurrentUser,
  Household,
  HouseholdCreate,
  HouseholdMember,
  HouseholdSettings,
  MemberAdd,
} from '../types';
import { apiRequest } from './client';

interface ItemAtHomeResponse {
  items_at_home: string[];
}

interface FavoriteRecipeResponse {
  favorite_recipes: string[];
}

export const adminApi = {
  getCurrentUser: (): Promise<CurrentUser> => {
    return apiRequest<CurrentUser>('/admin/me');
  },

  getHouseholds: (): Promise<Household[]> => {
    return apiRequest<Household[]>('/admin/households');
  },

  createHousehold: (data: HouseholdCreate): Promise<Household> => {
    return apiRequest<Household>('/admin/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getHousehold: (id: string): Promise<Household> => {
    return apiRequest<Household>(`/admin/households/${id}`);
  },

  renameHousehold: (id: string, name: string): Promise<Household> => {
    return apiRequest<Household>(`/admin/households/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  getHouseholdMembers: (householdId: string): Promise<HouseholdMember[]> => {
    return apiRequest<HouseholdMember[]>(
      `/admin/households/${householdId}/members`,
    );
  },

  addHouseholdMember: (
    householdId: string,
    data: MemberAdd,
  ): Promise<HouseholdMember> => {
    return apiRequest<HouseholdMember>(
      `/admin/households/${householdId}/members`,
      { method: 'POST', body: JSON.stringify(data) },
    );
  },

  removeHouseholdMember: (
    householdId: string,
    email: string,
  ): Promise<void> => {
    return apiRequest<void>(
      `/admin/households/${householdId}/members/${encodeURIComponent(email)}`,
      { method: 'DELETE' },
    );
  },

  getHouseholdSettings: (householdId: string): Promise<HouseholdSettings> => {
    return apiRequest<HouseholdSettings>(
      `/admin/households/${householdId}/settings`,
    );
  },

  updateHouseholdSettings: (
    householdId: string,
    settings: Partial<HouseholdSettings>,
  ): Promise<HouseholdSettings> => {
    return apiRequest<HouseholdSettings>(
      `/admin/households/${householdId}/settings`,
      { method: 'PUT', body: JSON.stringify(settings) },
    );
  },

  transferRecipe: (
    recipeId: string,
    targetHouseholdId: string,
  ): Promise<{
    id: string;
    title: string;
    household_id: string;
    message: string;
  }> => {
    return apiRequest<{
      id: string;
      title: string;
      household_id: string;
      message: string;
    }>(`/admin/recipes/${recipeId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ target_household_id: targetHouseholdId }),
    });
  },

  // Items at home
  getItemsAtHome: (householdId: string): Promise<ItemAtHomeResponse> => {
    return apiRequest<ItemAtHomeResponse>(
      `/admin/households/${householdId}/items-at-home`,
    );
  },

  addItemAtHome: (
    householdId: string,
    item: string,
  ): Promise<ItemAtHomeResponse> => {
    return apiRequest<ItemAtHomeResponse>(
      `/admin/households/${householdId}/items-at-home`,
      { method: 'POST', body: JSON.stringify({ item }) },
    );
  },

  removeItemAtHome: (
    householdId: string,
    item: string,
  ): Promise<ItemAtHomeResponse> => {
    return apiRequest<ItemAtHomeResponse>(
      `/admin/households/${householdId}/items-at-home/${encodeURIComponent(item)}`,
      { method: 'DELETE' },
    );
  },

  // Favorite recipes
  getFavoriteRecipes: (
    householdId: string,
  ): Promise<FavoriteRecipeResponse> => {
    return apiRequest<FavoriteRecipeResponse>(
      `/admin/households/${householdId}/favorites`,
    );
  },

  addFavoriteRecipe: (
    householdId: string,
    recipeId: string,
  ): Promise<FavoriteRecipeResponse> => {
    return apiRequest<FavoriteRecipeResponse>(
      `/admin/households/${householdId}/favorites`,
      { method: 'POST', body: JSON.stringify({ recipe_id: recipeId }) },
    );
  },

  removeFavoriteRecipe: (
    householdId: string,
    recipeId: string,
  ): Promise<FavoriteRecipeResponse> => {
    return apiRequest<FavoriteRecipeResponse>(
      `/admin/households/${householdId}/favorites/${encodeURIComponent(recipeId)}`,
      { method: 'DELETE' },
    );
  },
};
