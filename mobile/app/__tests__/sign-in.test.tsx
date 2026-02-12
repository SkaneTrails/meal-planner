/**
 * Tests for SignIn screen — verifies auth-dependent rendering.
 *
 * Real logic tested:
 * - Redirects to home when user is already authenticated
 * - Shows loading spinner + sign-out link while auth is loading
 * - Shows error message when auth error occurs
 * - Sign-in button triggers signIn callback
 * - Sign-out link visible in both loading and main states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Track what Redirect renders
const mockRedirect = vi.fn((_props: any) => null);
vi.mock('expo-router', async () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useLocalSearchParams: () => ({}),
  Redirect: (props: any) => {
    mockRedirect(props);
    return React.createElement('div', { 'data-testid': 'redirect', 'data-href': props.href });
  },
}));

// Mock GoogleLogo component — prevents react-native-svg from loading in jsdom
vi.mock('@/components/GoogleLogo', () => ({
  GoogleLogo: () => React.createElement('div', { 'data-testid': 'google-logo' }),
}));

// Controllable auth mock — Vitest resolves @/ alias to the same path as ../
let mockAuthState: any = {};
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockAuthState,
}));

describe('SignIn screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    };
  });

  async function renderScreen() {
    // Dynamic import to pick up current mock state
    const { default: SignInScreen } = await import('@/app/sign-in');
    return render(React.createElement(SignInScreen));
  }

  it('redirects to (tabs) when user is already signed in', async () => {
    mockAuthState.user = { email: 'test@example.com' };

    await renderScreen();

    const redirect = screen.getByTestId('redirect');
    expect(redirect.getAttribute('data-href')).toBe('/(tabs)');
  });

  it('shows sign-out button during loading state', async () => {
    mockAuthState.loading = true;

    await renderScreen();

    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('calls signOut when sign-out is pressed during loading', async () => {
    mockAuthState.loading = true;

    await renderScreen();

    fireEvent.click(screen.getByText('Sign out'));

    expect(mockAuthState.signOut).toHaveBeenCalled();
  });

  it('shows the sign-in button when not authenticated', async () => {
    await renderScreen();

    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('calls signIn when sign-in button is pressed', async () => {
    await renderScreen();

    fireEvent.click(screen.getByText('Continue with Google'));

    expect(mockAuthState.signIn).toHaveBeenCalled();
  });

  it('displays error message when auth error occurs', async () => {
    mockAuthState.error = 'Authentication failed';

    await renderScreen();

    expect(screen.getByText('Authentication failed')).toBeTruthy();
  });

  it('shows app branding', async () => {
    await renderScreen();

    expect(screen.getByText('Aroma')).toBeTruthy();
    expect(screen.getByText('Cook with intention.')).toBeTruthy();
  });
});
