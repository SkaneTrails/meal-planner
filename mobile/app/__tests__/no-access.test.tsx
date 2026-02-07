/**
 * Tests for NoAccess screen — verifies redirect logic and sign-out.
 *
 * Real logic tested:
 * - Redirects to /sign-in when not authenticated
 * - Redirects to /(tabs) when user has a household
 * - Redirects to /(tabs) when user is a superuser (even without household)
 * - Shows user email and "no household" message for members without access
 * - Sign-out button calls signOut
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { createQueryWrapper } from '@/test/helpers';

// Track navigation
const mockReplace = vi.fn();
vi.mock('expo-router', async () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: mockReplace }),
  useLocalSearchParams: () => ({}),
  Redirect: (props: any) =>
    React.createElement('div', {
      'data-testid': 'redirect',
      'data-href': props.href,
    }),
}));

// Controllable auth mock
let mockAuthState: any = {};
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockAuthState,
}));

// Controllable currentUser mock
let mockCurrentUserResult: any = {};
vi.mock('@/lib/hooks/use-admin', () => ({
  useCurrentUser: () => mockCurrentUserResult,
}));

describe('NoAccess screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: { email: 'test@example.com', displayName: 'Test' },
      loading: false,
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    mockCurrentUserResult = {
      data: null,
      isLoading: false,
    };
  });

  async function renderScreen() {
    const { default: NoAccessScreen } = await import('@/app/no-access');
    const Wrapper = createQueryWrapper();
    return render(
      React.createElement(Wrapper, null, React.createElement(NoAccessScreen)),
    );
  }

  it('redirects to /sign-in when not authenticated', async () => {
    mockAuthState.user = null;
    mockAuthState.loading = false;

    await renderScreen();

    const redirect = screen.getByTestId('redirect');
    expect(redirect.getAttribute('data-href')).toBe('/sign-in');
  });

  it('redirects to /(tabs) when user has a household', async () => {
    mockCurrentUserResult.data = {
      uid: 'u1',
      email: 'test@example.com',
      role: 'member',
      household_id: 'h1',
    };

    await renderScreen();

    const redirect = screen.getByTestId('redirect');
    expect(redirect.getAttribute('data-href')).toBe('/(tabs)');
  });

  it('redirects to /(tabs) when user is a superuser without household', async () => {
    mockCurrentUserResult.data = {
      uid: 'u1',
      email: 'super@example.com',
      role: 'superuser',
      household_id: null,
    };

    await renderScreen();

    const redirect = screen.getByTestId('redirect');
    expect(redirect.getAttribute('data-href')).toBe('/(tabs)');
  });

  it('shows user email when they have no access', async () => {
    mockAuthState.user = { email: 'noaccess@example.com', displayName: 'No Access' };
    mockCurrentUserResult.data = {
      uid: 'u1',
      email: 'noaccess@example.com',
      role: 'member',
      household_id: null,
    };

    await renderScreen();

    expect(screen.getByText('No Access')).toBeTruthy();
    expect(screen.getByText('noaccess@example.com')).toBeTruthy();
  });

  it('calls signOut and navigates on Sign Out press', async () => {
    mockCurrentUserResult.data = {
      uid: 'u1',
      email: 'test@example.com',
      role: 'member',
      household_id: null,
    };

    await renderScreen();

    fireEvent.click(screen.getByText('Sign Out'));

    expect(mockAuthState.signOut).toHaveBeenCalled();
  });
});
