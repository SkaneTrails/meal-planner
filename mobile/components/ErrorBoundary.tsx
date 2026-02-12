/**
 * Error boundary to catch rendering errors and display a fallback UI
 * instead of a blank white screen.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { colors, spacing, fontSize, fontFamily, borderRadius } from '@/lib/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    if (Platform.OS === 'web') {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
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
          backgroundColor: colors.bgLight,
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
            fontFamily: fontFamily.displayBold,
            color: colors.text.primary,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          Something went wrong
        </Text>
        <Text
          style={{
            fontSize: fontSize.sm,
            fontFamily: fontFamily.body,
            color: colors.text.secondary,
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
            backgroundColor: colors.text.primary,
            paddingHorizontal: spacing['2xl'],
            paddingVertical: spacing.md,
            borderRadius: borderRadius.full,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: fontSize.md,
              fontFamily: fontFamily.bodyMedium,
            }}
          >
            Reload App
          </Text>
        </Pressable>
      </View>
    );
  }
}
