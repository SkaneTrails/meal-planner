/**
 * Recipe API endpoints: CRUD, scraping, and image upload.
 */

import type {
  Recipe,
  RecipeCreate,
  RecipeParseRequest,
  RecipeScrapeRequest,
  RecipeUpdate,
} from '../types';
import { API_BASE_URL, API_PREFIX, ApiClientError, apiRequest, getAuthTokenFn } from './client';

export const recipeApi = {
  getRecipes: (search?: string): Promise<Recipe[]> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const query = params.toString();
    return apiRequest<Recipe[]>(`/recipes${query ? `?${query}` : ''}`);
  },

  getRecipe: (id: string): Promise<Recipe> => {
    return apiRequest<Recipe>(`/recipes/${id}`);
  },

  createRecipe: (recipe: RecipeCreate): Promise<Recipe> => {
    return apiRequest<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  },

  scrapeRecipe: async (url: string, enhance: boolean = false): Promise<Recipe> => {
    console.log('[scrapeRecipe] Starting client-side fetch for:', url);
    try {
      const htmlResponse = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5,sv;q=0.3',
        },
      });

      console.log('[scrapeRecipe] Client fetch response status:', htmlResponse.status);

      if (!htmlResponse.ok) {
        throw new ApiClientError(
          `Failed to fetch recipe page: ${htmlResponse.status}`,
          htmlResponse.status,
        );
      }

      const html = await htmlResponse.text();
      console.log('[scrapeRecipe] Got HTML, length:', html.length);

      const request: RecipeParseRequest = { url, html };
      const params = new URLSearchParams();
      if (enhance) params.set('enhance', 'true');
      const query = params.toString();

      console.log('[scrapeRecipe] Sending to /recipes/parse');
      return apiRequest<Recipe>(`/recipes/parse${query ? `?${query}` : ''}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.log('[scrapeRecipe] Client-side fetch failed:', error);
      if (error instanceof ApiClientError) {
        throw error;
      }
      console.log('[scrapeRecipe] Falling back to /recipes/scrape');
      const request: RecipeScrapeRequest = { url };
      const params = new URLSearchParams();
      if (enhance) params.set('enhance', 'true');
      const query = params.toString();
      return apiRequest<Recipe>(`/recipes/scrape${query ? `?${query}` : ''}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    }
  },

  updateRecipe: (id: string, updates: RecipeUpdate): Promise<Recipe> => {
    return apiRequest<Recipe>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteRecipe: (id: string): Promise<void> => {
    return apiRequest<void>(`/recipes/${id}`, { method: 'DELETE' });
  },

  uploadRecipeImage: async (id: string, imageUri: string): Promise<Recipe> => {
    const url = `${API_BASE_URL}${API_PREFIX}/recipes/${id}/image`;
    const formData = new FormData();

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

    const headers: Record<string, string> = { Accept: 'application/json' };

    const getAuthToken = getAuthTokenFn();
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
  },
};
