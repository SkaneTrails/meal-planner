/**
 * API client for the Meal Planner backend.
 * Provides typed methods for all API endpoints.
 */

import type {
  ApiError,
  CurrentUser,
  GroceryList,
  Household,
  HouseholdCreate,
  HouseholdMember,
  HouseholdSettings,
  MealPlan,
  MealPlanUpdate,
  MealUpdateRequest,
  MemberAdd,
  NoteUpdateRequest,
  Recipe,
  RecipeCreate,
  RecipeParseRequest,
  RecipeScrapeRequest,
  RecipeUpdate,
} from './types';

// API base URL - configurable for different environments
// Uses EXPO_PUBLIC_API_URL for production (Cloud Run API)
// Falls back to localhost for local development
const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();
const API_PREFIX = '/api/v1';

// Token getter function - set by AuthProvider
let getAuthToken: (() => Promise<string | null>) | null = null;

// Sign out callback - called when API returns 401/403 (auth failure)
// status: 401 = token invalid/expired, 403 = no household access
// hadToken: true if a token was sent with the request (helps distinguish auth failure from timing issues)
let onUnauthorized: ((status: number, hadToken: boolean) => void) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
  getAuthToken = getter;
}

export function setOnUnauthorized(callback: (status: number, hadToken: boolean) => void) {
  onUnauthorized = callback;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${API_PREFIX}${endpoint}`;

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    let hadToken = false;
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        hadToken = true;
        (defaultHeaders as Record<string, string>).Authorization =
          `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Handle 401/403 - trigger sign out to clear stale auth state
      // 401 = token invalid/expired, 403 = no household access
      // Only trigger if a token was sent (hadToken=true) - otherwise it's a race condition
      if ((response.status === 401 || response.status === 403) && onUnauthorized) {
        onUnauthorized(response.status, hadToken);
      }

      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new ApiClientError(
        typeof error.detail === 'string'
          ? error.detail
          : JSON.stringify(error.detail),
        response.status,
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Recipe endpoints
  async getRecipes(search?: string): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const query = params.toString();
    return this.request<Recipe[]>(`/recipes${query ? `?${query}` : ''}`);
  }

  async getRecipe(id: string): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${id}`);
  }

  async createRecipe(recipe: RecipeCreate): Promise<Recipe> {
    return this.request<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  async scrapeRecipe(url: string, enhance: boolean = false): Promise<Recipe> {
    // Client-side scraping: fetch HTML on the client to avoid cloud IP blocking
    // Some recipe sites (e.g., ICA.se) block requests from cloud providers
    console.log('[scrapeRecipe] Starting client-side fetch for:', url);
    try {
      const htmlResponse = await fetch(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5,sv;q=0.3',
        },
      });

      console.log(
        '[scrapeRecipe] Client fetch response status:',
        htmlResponse.status,
      );

      if (!htmlResponse.ok) {
        throw new ApiClientError(
          `Failed to fetch recipe page: ${htmlResponse.status}`,
          htmlResponse.status,
        );
      }

      const html = await htmlResponse.text();
      console.log('[scrapeRecipe] Got HTML, length:', html.length);

      // Send HTML to API for parsing
      const request: RecipeParseRequest = { url, html };
      const params = new URLSearchParams();
      if (enhance) params.set('enhance', 'true');
      const query = params.toString();

      console.log('[scrapeRecipe] Sending to /recipes/parse');
      return this.request<Recipe>(`/recipes/parse${query ? `?${query}` : ''}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.log('[scrapeRecipe] Client-side fetch failed:', error);
      if (error instanceof ApiClientError) {
        throw error;
      }
      // If client-side fetch fails (CORS, network error), fall back to server-side
      console.log('[scrapeRecipe] Falling back to /recipes/scrape');
      const request: RecipeScrapeRequest = { url };
      const params = new URLSearchParams();
      if (enhance) params.set('enhance', 'true');
      const query = params.toString();
      return this.request<Recipe>(
        `/recipes/scrape${query ? `?${query}` : ''}`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        },
      );
    }
  }

  async updateRecipe(id: string, updates: RecipeUpdate): Promise<Recipe> {
    return this.request<Recipe>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRecipe(id: string): Promise<void> {
    return this.request<void>(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadRecipeImage(id: string, imageUri: string): Promise<Recipe> {
    const url = `${this.baseUrl}${API_PREFIX}/recipes/${id}/image`;

    // Create form data for image upload
    const formData = new FormData();

    // Get file info from URI with safe fallbacks
    let fileName = `recipe_${id}.jpg`;
    let mimeType = 'image/jpeg';

    try {
      const uriWithoutQuery = imageUri.split('?')[0].split('#')[0];
      const pathSegments = uriWithoutQuery.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      const dotIndex = lastSegment.lastIndexOf('.');

      if (dotIndex !== -1 && dotIndex < lastSegment.length - 1) {
        const ext = lastSegment.substring(dotIndex + 1).toLowerCase();
        if (/^[a-z0-9]+$/.test(ext)) {
          fileName = `recipe_${id}.${ext}`;
          mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        }
      }
    } catch {
      // Keep defaults if parsing fails
    }

    formData.append('file', {
      uri: imageUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Add auth token if available
    if (getAuthToken) {
      const token = await getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      let error: { detail?: string | unknown } = {};
      try {
        error = await response.json();
      } catch {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new ApiClientError(
        typeof error.detail === 'string'
          ? error.detail
          : JSON.stringify(error.detail),
        response.status,
      );
    }

    return response.json();
  }

  // Meal Plan endpoints
  // Note: household_id is resolved server-side from the authenticated user
  async getMealPlan(): Promise<MealPlan> {
    return this.request<MealPlan>('/meal-plans');
  }

  async updateMealPlan(updates: MealPlanUpdate): Promise<MealPlan> {
    return this.request<MealPlan>('/meal-plans', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateMeal(request: MealUpdateRequest): Promise<MealPlan> {
    return this.request<MealPlan>('/meal-plans/meals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateNote(request: NoteUpdateRequest): Promise<MealPlan> {
    return this.request<MealPlan>('/meal-plans/notes', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async clearMealPlan(): Promise<void> {
    return this.request<void>('/meal-plans', {
      method: 'DELETE',
    });
  }

  // Grocery endpoints
  // Note: household_id is resolved server-side from the authenticated user
  async getGroceryList(options?: {
    start_date?: string;
    end_date?: string;
    days?: number;
  }): Promise<GroceryList> {
    const params = new URLSearchParams();
    if (options?.start_date) params.set('start_date', options.start_date);
    if (options?.end_date) params.set('end_date', options.end_date);
    if (options?.days) params.set('days', options.days.toString());
    const query = params.toString();
    return this.request<GroceryList>(`/grocery${query ? `?${query}` : ''}`);
  }

  // Admin endpoints
  async getCurrentUser(): Promise<CurrentUser> {
    return this.request<CurrentUser>('/admin/me');
  }

  async getHouseholds(): Promise<Household[]> {
    return this.request<Household[]>('/admin/households');
  }

  async createHousehold(data: HouseholdCreate): Promise<Household> {
    return this.request<Household>('/admin/households', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHousehold(id: string): Promise<Household> {
    return this.request<Household>(`/admin/households/${id}`);
  }

  async getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
    return this.request<HouseholdMember[]>(
      `/admin/households/${householdId}/members`,
    );
  }

  async addHouseholdMember(
    householdId: string,
    data: MemberAdd,
  ): Promise<HouseholdMember> {
    return this.request<HouseholdMember>(
      `/admin/households/${householdId}/members`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  }

  async removeHouseholdMember(
    householdId: string,
    email: string,
  ): Promise<void> {
    return this.request<void>(
      `/admin/households/${householdId}/members/${encodeURIComponent(email)}`,
      {
        method: 'DELETE',
      },
    );
  }

  async getHouseholdSettings(householdId: string): Promise<HouseholdSettings> {
    return this.request<HouseholdSettings>(
      `/admin/households/${householdId}/settings`,
    );
  }

  async updateHouseholdSettings(
    householdId: string,
    settings: Partial<HouseholdSettings>,
  ): Promise<HouseholdSettings> {
    return this.request<HouseholdSettings>(
      `/admin/households/${householdId}/settings`,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      },
    );
  }

  async transferRecipe(
    recipeId: string,
    targetHouseholdId: string,
  ): Promise<{ id: string; title: string; household_id: string; message: string }> {
    return this.request<{ id: string; title: string; household_id: string; message: string }>(
      `/admin/recipes/${recipeId}/transfer`,
      {
        method: 'POST',
        body: JSON.stringify({ target_household_id: targetHouseholdId }),
      },
    );
  }
}

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for testing/custom instances
export { ApiClient };
