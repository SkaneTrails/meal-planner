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
  /** Optional label for the back button (renders as text variant when provided). */
  backLabel?: string;
  rightAction?: ReactNode;
  children?: ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader = ({
  title,
  subtitle,
  variant = 'centered',
  onBack,
  backLabel,
  rightAction,
  children,
  style,
}: ScreenHeaderProps) => {
  const { shadows } = useTheme();
  const isLarge = variant === 'large';
  const hasBack = !!onBack;
  const hasNav = hasBack || !!rightAction;
  // When the large header has a right action but no back button, we float
  // that action over the title row instead of reserving a separate nav
  // band above it. That kept the top ~80px of phone screens entirely
  // empty except for a small icon.
  const floatRightAction = isLarge && !!rightAction && !hasBack;

  return (
    <ScreenHeaderBar style={style}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: isLarge ? layout.screenPaddingTop : spacing.lg,
          paddingBottom: children ? spacing.sm : spacing.md,
        }}
      >
        {isLarge && hasNav && !floatRightAction && (
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
                label={backLabel}
                tone={backLabel ? 'alt' : 'glass'}
                size="md"
                style={
                  backLabel
                    ? { padding: spacing.sm, marginLeft: -spacing.sm }
                    : shadows.sm
                }
              />
            ) : (
              <View />
            )}
            {rightAction}
          </View>
        )}
        {floatRightAction ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <ScreenTitle
                variant={variant}
                title={title}
                subtitle={subtitle}
              />
            </View>
            {rightAction}
          </View>
        ) : (
          <ScreenTitle variant={variant} title={title} subtitle={subtitle} />
        )}
      </View>
      {children}
    </ScreenHeaderBar>
  );
};
