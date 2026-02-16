import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useRef } from 'react';
import { Animated, LayoutAnimation, Pressable, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '@/lib/theme';

interface CollapsibleSectionProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle: string;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  rightAccessory?: ReactNode;
  children: ReactNode;
}

export const CollapsibleSection = ({
  icon,
  iconColor = colors.content.body,
  title,
  subtitle,
  expanded,
  onToggle,
  disabled,
  rightAccessory,
  children,
}: CollapsibleSectionProps) => {
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const handleToggle = () => {
    if (LayoutAnimation?.configureNext && LayoutAnimation?.Presets) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    onToggle();
  };

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: expanded ? spacing.md : 0,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.glass.faint,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.md,
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        </View>
        {rightAccessory ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginLeft: spacing.sm,
            }}
          >
            {!disabled && (
              <Animated.View
                style={{ transform: [{ rotate: chevronRotation }] }}
              >
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.text.dark + '40'}
                />
              </Animated.View>
            )}
            {rightAccessory}
          </View>
        ) : (
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons
              name="chevron-down"
              size={20}
              color={colors.text.dark + '60'}
            />
          </Animated.View>
        )}
      </Pressable>
      {expanded && !disabled && <View>{children}</View>}
    </View>
  );
};
