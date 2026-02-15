/**
 * Recipe API endpoints: CRUD, scraping, and image upload.
 */

import { Platform } from 'react-native';
import type {
  EnhancementReviewAction,
  PaginatedRecipeList,
  Recipe,
  RecipeCreate,
  RecipeNote,
  RecipeNoteCreate,
  RecipeParseRequest,
  RecipePreview,
  RecipePreviewRequest,
  RecipeScrapeRequest,
  RecipeUpdate,
} from '../types';
import {
  API_BASE_URL,
  API_PREFIX,
  ApiClientError,
  apiRequest,
  getAuthTokenFn,
} from './client';

export const recipeApi = {
  getRecipes: (
    search?: string,
    cursor?: string,
    limit?: number,
    showHidden?: boolean,
  ): Promise<PaginatedRecipeList> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    if (showHidden) params.set('show_hidden', 'true');
    const query = params.toString();
    return apiRequest<PaginatedRecipeList>(
      `/recipes${query ? `?${query}` : ''}`,
    );
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

  scrapeRecipe: async (
    url: string,
    enhance: boolean = false,
  ): Promise<Recipe> => {
    // Validate URL before attempting fetch — TypeError from new URL()
    // should be a hard error, not fall through to server-side scraping.
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ApiClientError('Invalid URL', 400);
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ApiClientError('Only http and https URLs are supported', 400);
    }

    try {
      const htmlResponse = await fetch(url, {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5,sv;q=0.3',
        },
      });

      if (!htmlResponse.ok) {
        throw new ApiClientError(
          `Failed to fetch recipe page: ${htmlResponse.status}`,
          htmlResponse.status,
        );
      }

      const html = await htmlResponse.text();

      const request: RecipeParseRequest = { url, html };
      const params = new URLSearchParams();
      if (enhance) params.set('enhance', 'true');
      const query = params.toString();

      return apiRequest<Recipe>(`/recipes/parse${query ? `?${query}` : ''}`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      // TypeError from fetch means CORS or network error — fall through
      // to server-side scraping. Invalid URLs are already caught above.
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

  previewRecipe: async (
    url: string,
    html: string,
    enhance: boolean = true,
  ): Promise<RecipePreview> => {
    const request: RecipePreviewRequest = { url, html, enhance };
    return apiRequest<RecipePreview>('/recipes/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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

  reviewEnhancement: (
    id: string,
    action: EnhancementReviewAction,
  ): Promise<Recipe> => {
    return apiRequest<Recipe>(`/recipes/${id}/enhancement/review`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  enhanceRecipe: (id: string): Promise<Recipe> => {
    return apiRequest<Recipe>(`/recipes/${id}/enhance`, {
      method: 'POST',
    });
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

    if (Platform.OS === 'web') {
      // On web, blob: URIs must be fetched into a real Blob/File object.
      // The RN-style { uri, name, type } shorthand only works on native.
      const imageResponse = await fetch(imageUri);
      if (!imageResponse.ok) {
        throw new ApiClientError(
          `Failed to load image from URI (status ${imageResponse.status} ${imageResponse.statusText})`,
          imageResponse.status,
        );
      }
      const blob = await imageResponse.blob();
      const file = new File([blob], fileName, { type: blob.type || mimeType });
      formData.append('file', file);
    } else {
      formData.append('file', {
        uri: imageUri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);
    }

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

  // ── Recipe Notes ────────────────────────────────────────────────

  getRecipeNotes: (recipeId: string): Promise<RecipeNote[]> => {
    return apiRequest<RecipeNote[]>(`/recipes/${recipeId}/notes`);
  },

  createRecipeNote: (
    recipeId: string,
    note: RecipeNoteCreate,
  ): Promise<RecipeNote> => {
    return apiRequest<RecipeNote>(`/recipes/${recipeId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  deleteRecipeNote: (recipeId: string, noteId: string): Promise<void> => {
    return apiRequest<void>(`/recipes/${recipeId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};
