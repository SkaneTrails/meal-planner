/**
 * Shared URL parsing and validation utilities for recipe import flows.
 */

export const extractHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export const isValidUrl = (text: string): boolean => {
  try {
    const parsed = new URL(text);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};
