import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useRef } from 'react';
import {
  Animated,
  LayoutAnimation,
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { fontSize, fontWeight, spacing, useTheme } from '@/lib/theme';
import { IconCircle } from './IconCircle';

type SectionSize = 'sm' | 'md';

export interface SectionProps {
  title: string;
  /** Optional subtitle below title. Typically used with `size="md"`. */
  subtitle?: string;
  /** Optional Ionicon name. When omitted, no icon circle renders. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Override icon color. Default: theme-derived per size. */
  iconColor?: string;
  /** Override icon background. Default: theme-derived per size. */
  iconBg?: string;
  /** Header + icon scale. `"md"` for settings, `"sm"` for recipe detail. */
  size?: SectionSize;
  /** When true, header is pressable and toggles children visibility. */
  collapsible?: boolean;
  /** Controlled expanded state. Required when `collapsible` is true. */
  expanded?: boolean;
  /** Toggle callback. Required when `collapsible` is true. */
  onToggle?: () => void;
  /** Disables toggle and hides children (collapsible only). */
  disabled?: boolean;
  /** Slot rendered to the right of the title row (e.g., ThemeToggle, step counter). */
  rightAccessory?: ReactNode;
  /** Outer margin bottom. Default: `spacing.xl` (md) / `spacing.xl` (sm). */
  spacing?: number;
  /** Additional style applied to the outer container (e.g. marginTop). */
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/**
 * Universal section wrapper with header row (optional icon + title + subtitle)
 * and optional animated collapse/expand.
 *
 * Replaces CollapsibleSection, SectionHeader, and hand-rolled recipe detail
 * section headers with a single theme-aware primitive.
 */
export const Section = ({
  title,
  subtitle,
  icon,
  iconColor: iconColorProp,
  iconBg: iconBgProp,
  size = 'md',
  collapsible = false,
  expanded = true,
  onToggle,
  disabled = false,
  rightAccessory,
  spacing: spacingProp,
  style,
  children,
}: SectionProps) => {
  const { colors, typography } = useTheme();
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const isCollapsible = collapsible && !!onToggle;
  const showChildren = isCollapsible ? expanded && !disabled : true;
  const outerMargin = spacingProp ?? spacing.xl;

  const handleToggle = () => {
    if (!isCollapsible) return;
    if (LayoutAnimation?.configureNext && LayoutAnimation?.Presets) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onToggle?.();
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // --- Size-dependent values ---
  const iconSize = size === 'sm' ? ('xs' as const) : ('md' as const);
  const iconPixels = size === 'sm' ? 18 : 20;
  const resolvedIconColor =
    iconColorProp ??
    (size === 'sm' ? colors.content.body : colors.content.body);
  const resolvedIconBg =
    iconBgProp ?? (size === 'sm' ? colors.surface.active : colors.glass.faint);

  const titleStyle =
    size === 'sm'
      ? { ...typography.displaySmall, color: colors.content.heading }
      : {
          fontSize: fontSize.lg,
          fontWeight: fontWeight.bold,
          color: colors.content.heading,
        };

  const headerMarginBottom = isCollapsible
    ? expanded
      ? spacing.md
      : 0
    : size === 'sm'
      ? spacing.lg
      : spacing.md;

  // --- Header content (shared between pressable and static) ---
  const headerContent = (
    <>
      {icon && (
        <IconCircle
          size={iconSize}
          bg={resolvedIconBg}
          style={{ marginRight: spacing.md }}
        >
          <Ionicons name={icon} size={iconPixels} color={resolvedIconColor} />
        </IconCircle>
      )}
      <View style={{ flex: 1 }}>
        <Text style={titleStyle}>{title}</Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.subtitle,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightAccessory && !isCollapsible && rightAccessory}
      {isCollapsible && (
        <ChevronWithAccessory
          rightAccessory={rightAccessory}
          disabled={disabled}
          chevronRotation={chevronRotation}
          colors={colors}
        />
      )}
    </>
  );

  return (
    <View style={[{ marginBottom: outerMargin }, style]}>
      {isCollapsible ? (
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: headerMarginBottom,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {headerContent}
        </Pressable>
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: headerMarginBottom,
          }}
        >
          {headerContent}
        </View>
      )}
      {showChildren && children && <View>{children}</View>}
    </View>
  );
};

// --- Chevron sub-component ---

interface ChevronWithAccessoryProps {
  rightAccessory?: ReactNode;
  disabled: boolean;
  chevronRotation: Animated.AnimatedInterpolation<string>;
  colors: ReturnType<typeof useTheme>['colors'];
}

const ChevronWithAccessory = ({
  rightAccessory,
  disabled,
  chevronRotation,
  colors,
}: ChevronWithAccessoryProps) => {
  if (rightAccessory) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginLeft: spacing.sm,
        }}
      >
        {!disabled && (
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.content.placeholder}
            />
          </Animated.View>
        )}
        {rightAccessory}
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
      <Ionicons name="chevron-down" size={20} color={colors.content.subtitle} />
    </Animated.View>
  );
};
