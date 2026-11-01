/**
 * Tests for the tab layout's access gate.
 *
 * Real logic tested:
 * - Renders the tabs from a cached user without waiting for the server
 * - A failed background check of a cached user (offline) keeps the tabs
 * - A 403 (no household) redirects to /no-access, even with a cached user
 * - No cached user and an error redirects to /no-access
 * - Waits until the device data is claimed for the signed-in user
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/lib/api/client';

vi.mock('expo-router', () => {
  const Tabs = Object.assign(
    ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'tabs' }, children),
    { Screen: () => null },
  );
  return {
    Tabs,
    Redirect: (props: { href: string }) =>
      React.createElement('div', { 'data-testid': 'redirect', 'data-href': props.href }),
  };
});

vi.mock('@/components/FullScreenLoading', () => ({
  FullScreenLoading: () => React.createElement('div', { 'data-testid': 'loading' }),
}));

vi.mock('@/lib/i18n', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

let mockAuthState: { user: { uid: string } | null; loading: boolean };
vi.mock('@/lib/hooks/use-auth', () => ({ useAuth: () => mockAuthState }));

let mockCurrentUser: { data?: unknown; error: unknown };
vi.mock('@/lib/hooks/use-admin', () => ({ useCurrentUser: () => mockCurrentUser }));

let mockLocalDataReady = true;
vi.mock('@/lib/local-data-context', () => ({
  useLocalDataReady: () => mockLocalDataReady,
}));

import TabLayout from '../(tabs)/_layout';

const cachedUser = { uid: 'user-1', email: 'a@b.c', role: 'member', household_id: 'hh-1' };

describe('TabLayout access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = { user: { uid: 'user-1' }, loading: false };
    mockCurrentUser = { data: cachedUser, error: null };
    mockLocalDataReady = true;
  });

  it('renders the tabs from a cached user without waiting for the server', () => {
    render(React.createElement(TabLayout));

    expect(screen.getByTestId('tabs')).toBeDefined();
  });

  it('keeps the tabs when the background check fails offline', () => {
    mockCurrentUser = { data: cachedUser, error: new TypeError('Network request failed') };

    render(React.createElement(TabLayout));

    expect(screen.getByTestId('tabs')).toBeDefined();
  });

  it('redirects to no-access on a 403, even with a cached user', () => {
    mockCurrentUser = { data: cachedUser, error: new ApiClientError('Forbidden', 403) };

    render(React.createElement(TabLayout));

    expect(screen.getByTestId('redirect').getAttribute('data-href')).toBe('/no-access');
  });

  it('redirects to no-access on an error with no cached user', () => {
    mockCurrentUser = { data: undefined, error: new Error('boom') };

    render(React.createElement(TabLayout));

    expect(screen.getByTestId('redirect').getAttribute('data-href')).toBe('/no-access');
  });

  it('waits until the device data is claimed for this user', () => {
    mockLocalDataReady = false;

    render(React.createElement(TabLayout));

    expect(screen.getByTestId('loading')).toBeDefined();
  });

  it('redirects to sign-in when signed out', () => {
    mockAuthState = { user: null, loading: false };
    mockCurrentUser = { data: undefined, error: null };

    render(React.createElement(TabLayout));

    expect(screen.getByTestId('redirect').getAttribute('data-href')).toBe('/sign-in');
  });
});
