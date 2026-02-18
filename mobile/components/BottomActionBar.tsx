import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { layout, spacing } from '@/lib/theme';

interface BottomActionBarProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Absolute-positioned bottom bar that floats above the tab bar.
 * Handles only positioning — button rendering is delegated to children (e.g. Button).
 */
const BottomActionBar = ({ children, style }: BottomActionBarProps) => (
  <View
    style={[
      {
        position: 'absolute',
        bottom: layout.tabBar.overlayBottomOffset,
        left: 0,
        right: 0,
        padding: spacing.lg,
      },
      style,
    ]}
  >
    {children}
  </View>
);

export { BottomActionBar };
