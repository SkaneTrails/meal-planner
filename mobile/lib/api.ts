/**
 * API client for the Meal Planner backend.
 * Provides typed methods for all API endpoints.
 */

import { Platform } from 'react-native';
import type {
  Recipe,
  RecipeCreate,
  RecipeUpdate,
  RecipeScrapeRequest,
  MealPlan,
  MealPlanUpdate,
  MealUpdateRequest,
  NoteUpdateRequest,
  GroceryList,
  ApiError,
} from './types';

// API base URL - configurable for different environments
// On web, always use localhost since it runs on the same machine
// On mobile, use the env variable (which should be your machine's IP)
const getApiBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();
const API_PREFIX = '/api/v1';

// Default user ID until auth is implemented
const DEFAULT_USER_ID = 'default';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${API_PREFIX}${endpoint}`;

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new ApiClientError(
        typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail),
        response.status
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Recipe endpoints
  async getRecipes(search?: string, enhanced: boolean = false): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (enhanced) params.set('enhanced', 'true');
    const query = params.toString();
    return this.request<Recipe[]>(`/recipes${query ? `?${query}` : ''}`);
  }

  async getRecipe(id: string, enhanced: boolean = false): Promise<Recipe> {
    const params = new URLSearchParams();
    if (enhanced) params.set('enhanced', 'true');
    const query = params.toString();
    return this.request<Recipe>(`/recipes/${id}${query ? `?${query}` : ''}`);
  }

  async createRecipe(recipe: RecipeCreate): Promise<Recipe> {
    return this.request<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  async scrapeRecipe(url: string): Promise<Recipe> {
    const request: RecipeScrapeRequest = { url };
    return this.request<Recipe>('/recipes/scrape', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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

  async uploadRecipeImage(id: string, imageUri: string, enhanced: boolean = false): Promise<Recipe> {
    const url = `${this.baseUrl}${API_PREFIX}/recipes/${id}/image${enhanced ? '?enhanced=true' : ''}`;
    
    // Create form data for image upload
    const formData = new FormData();
    
    // Get file info from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: imageUri,
      name: `recipe_${id}.${fileType}`,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    } as unknown as Blob);
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new ApiClientError(
        typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail),
        response.status
      );
    }
    
    return response.json();
  }

  // Meal Plan endpoints
  async getMealPlan(userId: string = DEFAULT_USER_ID): Promise<MealPlan> {
    return this.request<MealPlan>(`/meal-plans/${userId}`);
  }

  async updateMealPlan(
    updates: MealPlanUpdate,
    userId: string = DEFAULT_USER_ID
  ): Promise<MealPlan> {
    return this.request<MealPlan>(`/meal-plans/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateMeal(
    request: MealUpdateRequest,
    userId: string = DEFAULT_USER_ID
  ): Promise<MealPlan> {
    return this.request<MealPlan>(`/meal-plans/${userId}/meals`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateNote(
    request: NoteUpdateRequest,
    userId: string = DEFAULT_USER_ID
  ): Promise<MealPlan> {
    return this.request<MealPlan>(`/meal-plans/${userId}/notes`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async clearMealPlan(userId: string = DEFAULT_USER_ID): Promise<void> {
    return this.request<void>(`/meal-plans/${userId}`, {
      method: 'DELETE',
    });
  }

  // Grocery endpoints
  async getGroceryList(
    userId: string = DEFAULT_USER_ID,
    options?: {
      start_date?: string;
      end_date?: string;
      days?: number;
    }
  ): Promise<GroceryList> {
    const params = new URLSearchParams();
    if (options?.start_date) params.set('start_date', options.start_date);
    if (options?.end_date) params.set('end_date', options.end_date);
    if (options?.days) params.set('days', options.days.toString());
    const query = params.toString();
    return this.request<GroceryList>(`/grocery/${userId}${query ? `?${query}` : ''}`);
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
