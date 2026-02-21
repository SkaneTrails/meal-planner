/**
 * Unified screen wrapper providing the common shell for every screen:
 * GradientBackground + content container + bottom padding.
 *
 * Screens only provide their content; ScreenLayout handles the chrome.
 *
 * Usage (typical tab screen):
 *   <ScreenLayout>
 *     <ScreenHeaderBar>…</ScreenHeaderBar>
 *     <ScrollView …>{content}</ScrollView>
 *   </ScreenLayout>
 *
 * Usage (centered auth screen):
 *   <ScreenLayout animated centered>
 *     <Text>Brand</Text>
 *   </ScreenLayout>
 */

import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { GradientBackground } from '@/components/GradientBackground';
import { layout } from '@/lib/theme';

interface ScreenLayoutProps {
  children: ReactNode;
  /** Animated gradient background (home, sign-in, no-access). */
  animated?: boolean;
  /** Center children vertically and horizontally (sign-in, no-access). Disables contentContainer. */
  centered?: boolean;
  /** Apply `layout.contentContainer` (maxWidth + center). Defaults to `true` unless `centered`. */
  constrained?: boolean;
  /** Extra style merged onto the inner container View. */
  style?: ViewStyle;
}

export const ScreenLayout = ({
  children,
  animated = false,
  centered = false,
  constrained: constrainedProp,
  style,
}: ScreenLayoutProps) => {
  const constrained = constrainedProp ?? !centered;

  if (centered) {
    return (
      <GradientBackground animated={animated} style={{ flex: 1 }}>
        <View
          style={[
            {
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            },
            style,
          ]}
        >
          {children}
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground animated={animated} style={style}>
      <View
        style={[{ flex: 1 }, constrained && layout.contentContainer]}
        testID="screen-layout-container"
      >
        {children}
      </View>
    </GradientBackground>
  );
};
