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
  children: ReactNode;
}

export const CollapsibleSection = ({
  icon,
  iconColor = '#5D4E40',
  title,
  subtitle,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) => {
  const rotateAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
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
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.text.dark + '60'}
          />
        </Animated.View>
      </Pressable>
      {expanded && <View>{children}</View>}
    </View>
  );
};
