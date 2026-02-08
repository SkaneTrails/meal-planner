/**
 * API client configuration, auth token management, and error class.
 */

import type { ApiError } from '../types';

// API base URL - configurable for different environments
const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_PREFIX = '/api/v1';

// Token getter function - set by AuthProvider
let getAuthToken: (() => Promise<string | null>) | null = null;

// Sign out callback - called when API returns 401/403 (auth failure)
// status: 401 = token invalid/expired, 403 = no household access
// hadToken: true if a token was sent with the request
let onUnauthorized: ((status: number, hadToken: boolean) => void) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  getAuthToken = getter;
};

export const setOnUnauthorized = (callback: (status: number, hadToken: boolean) => void) => {
  onUnauthorized = callback;
};

export const getAuthTokenFn = () => getAuthToken;
export const getOnUnauthorizedFn = () => onUnauthorized;

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

/**
 * Shared request helper used by ApiClient.
 * Handles auth headers, error responses, and 204 No Content.
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  let hadToken = false;
  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) {
      hadToken = true;
      (defaultHeaders as Record<string, string>).Authorization = `Bearer ${token}`;
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};
