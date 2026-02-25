import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenHeaderBar } from '@/components/ScreenHeaderBar';
import { ScreenTitle } from '@/components/ScreenTitle';
import { layout, spacing, useTheme } from '@/lib/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'centered' | 'large';
  onBack?: () => void;
  rightAction?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader = ({
  title,
  subtitle,
  variant = 'centered',
  onBack,
  rightAction,
  children,
  style,
}: ScreenHeaderProps) => {
  const { shadows } = useTheme();
  const isLarge = variant === 'large';
  const hasNav = !!onBack || !!rightAction;

  return (
    <ScreenHeaderBar style={style}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: isLarge ? layout.screenPaddingTop : spacing.lg,
          paddingBottom: children ? spacing.sm : spacing.md,
        }}
      >
        {isLarge && hasNav && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            {onBack ? (
              <ActionButton.Back
                onPress={onBack}
                tone="glass"
                size="md"
                style={shadows.sm}
              />
            ) : (
              <View />
            )}
            {rightAction}
          </View>
        )}
        <ScreenTitle variant={variant} title={title} subtitle={subtitle} />
      </View>
      {children}
    </ScreenHeaderBar>
  );
};
