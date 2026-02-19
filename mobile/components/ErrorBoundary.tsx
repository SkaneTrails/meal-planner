/**
 * Error boundary to catch rendering errors and display a fallback UI
 * instead of a blank white screen.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { borderRadius, fontSize, spacing } from '@/lib/theme';

// Hardcoded fallback values — class components can't call useTheme().
// This is a last-resort error UI, so it intentionally avoids theme machinery.
const FALLBACK = {
  bgLight: '#FDF6F0',
  textDark: '#2D2D2D',
  textMuted: '#757575',
  primary: '#2D2D2D',
  white: '#FFFFFF',
  font: 'System',
} as const;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: FALLBACK.bgLight,
          padding: spacing['3xl'],
        }}
      >
        <Text
          style={{
            fontSize: fontSize['4xl'],
            marginBottom: spacing.lg,
          }}
        >
          😵
        </Text>
        <Text
          style={{
            fontSize: fontSize.xl,
            fontFamily: FALLBACK.font,
            color: FALLBACK.textDark,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          Something went wrong
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            fontFamily: FALLBACK.font,
            color: FALLBACK.textMuted,
            textAlign: 'center',
            marginBottom: spacing['2xl'],
            lineHeight: fontSize.sm * 1.5,
          }}
        >
          The app ran into an unexpected error. Try reloading.
        </Text>
        <Pressable
          onPress={this.handleReload}
          style={{
            backgroundColor: FALLBACK.primary,
            paddingHorizontal: spacing['2xl'],
            paddingVertical: spacing.md,
            borderRadius: borderRadius.full,
          }}
        >
          <Text
            style={{
              color: FALLBACK.white,
              fontSize: fontSize.md,
              fontFamily: FALLBACK.font,
            }}
          >
            Reload App
          </Text>
        </Pressable>
      </View>
    );
  }
}
