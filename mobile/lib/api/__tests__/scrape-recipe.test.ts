/**
 * Tests for recipeApi.scrapeRecipe — client-side fetch with server fallback.
 *
 * Real logic tested:
 * - Successful page fetch → POST /recipes/parse with the HTML
 * - Thrown fetch (CORS on web, network) → POST /recipes/scrape
 * - Bot-block statuses (403, 429, 5xx) → POST /recipes/scrape
 * - Other non-OK statuses (404) → hard error, no fallback
 * - Browser-like User-Agent on native only
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Platform } from 'react-native';

const mockApiRequest = vi.fn();

vi.mock('../client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../client')>();
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  };
});

import { recipeApi } from '../recipes';

const URL_UNDER_TEST = 'https://example.com/recipe';
const mockFetch = vi.fn();

const htmlResponse = (status: number, body = '<html></html>') =>
  ({ ok: status >= 200 && status < 300, status, text: async () => body }) as Response;

const endpointCalled = () => mockApiRequest.mock.calls[0]?.[0] as string;

describe('recipeApi.scrapeRecipe', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    mockApiRequest.mockResolvedValue({ id: 'r1' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (Platform as { OS: string }).OS = originalOS;
  });

  it('parses client-fetched HTML on the server', async () => {
    mockFetch.mockResolvedValue(htmlResponse(200, '<html>recipe</html>'));

    await recipeApi.scrapeRecipe(URL_UNDER_TEST, true);

    expect(endpointCalled()).toBe('/recipes/parse?enhance=true');
    const body = JSON.parse(mockApiRequest.mock.calls[0][1].body);
    expect(body).toEqual({ url: URL_UNDER_TEST, html: '<html>recipe</html>' });
  });

  it('falls back to server scrape when fetch throws (CORS / network)', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await recipeApi.scrapeRecipe(URL_UNDER_TEST);

    expect(endpointCalled()).toBe('/recipes/scrape');
  });

  it.each([403, 429, 500, 503])('falls back to server scrape on HTTP %i', async (status) => {
    mockFetch.mockResolvedValue(htmlResponse(status));

    await recipeApi.scrapeRecipe(URL_UNDER_TEST, false, 'veggie');

    expect(endpointCalled()).toBe('/recipes/scrape?diet_label=veggie');
  });

  it('throws without fallback on HTTP 404', async () => {
    mockFetch.mockResolvedValue(htmlResponse(404));

    await expect(recipeApi.scrapeRecipe(URL_UNDER_TEST)).rejects.toMatchObject({
      status: 404,
    });
    expect(mockApiRequest).not.toHaveBeenCalled();
  });

  it('sends a browser User-Agent on native', async () => {
    (Platform as { OS: string }).OS = 'android';
    mockFetch.mockResolvedValue(htmlResponse(200));

    await recipeApi.scrapeRecipe(URL_UNDER_TEST);

    expect(mockFetch.mock.calls[0][1].headers['User-Agent']).toMatch(/^Mozilla\/5\.0/);
  });

  it('does not set User-Agent on web', async () => {
    (Platform as { OS: string }).OS = 'web';
    mockFetch.mockResolvedValue(htmlResponse(200));

    await recipeApi.scrapeRecipe(URL_UNDER_TEST);

    expect(mockFetch.mock.calls[0][1].headers).not.toHaveProperty('User-Agent');
  });
});
