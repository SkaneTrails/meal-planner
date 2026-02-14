/**
 * API client configuration, auth token management, and error class.
 */

import type { ApiError } from '../types';

const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_PREFIX = '/api/v1';

let getAuthToken: (() => Promise<string | null>) | null = null;

// Sign out callback - called when API returns 401/403 (auth failure)
// status: 401 = token invalid/expired, 403 = no household access
// hadToken: true if a token was sent with the request
let onUnauthorized: ((status: number, hadToken: boolean) => void) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  getAuthToken = getter;
};

export const setOnUnauthorized = (
  callback: (status: number, hadToken: boolean) => void,
) => {
  onUnauthorized = callback;
};

export const getAuthTokenFn = () => getAuthToken;
export const getOnUnauthorizedFn = () => onUnauthorized;

export class ApiClientError extends Error {
  status: number;
  reason?: string;

  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.reason = reason;
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
    if (
      (response.status === 401 || response.status === 403) &&
      onUnauthorized
    ) {
      onUnauthorized(response.status, hadToken);
    }

    let error: ApiError;
    try {
      error = await response.json();
    } catch {
      error = { detail: `HTTP ${response.status}: ${response.statusText}` };
    }

    const detail = error.detail;
    let message: string;
    let reason: string | undefined;

    if (typeof detail === 'object' && detail !== null && 'message' in detail) {
      const structured = detail as { message: string; reason?: string };
      message = structured.message;
      reason = structured.reason;
    } else if (typeof detail === 'string') {
      message = detail;
    } else {
      message = JSON.stringify(detail);
    }

    throw new ApiClientError(message, response.status, reason);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};
