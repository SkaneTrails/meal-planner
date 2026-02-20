import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import {
  fontSize,
  iconContainer,
  layout,
  lineHeight,
  spacing,
  useTheme,
} from '@/lib/theme';

interface EmptyGroceryStateProps {
  title: string;
  subtitle: string;
}

export const EmptyGroceryState = ({
  title,
  subtitle,
}: EmptyGroceryStateProps) => {
  const { colors, fonts, borderRadius, visibility } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['3xl'],
        paddingBottom: layout.tabBar.contentBottomPadding,
      }}
    >
      {visibility.showEmptyStateIcon && (
        <View
          style={{
            width: iconContainer['2xl'],
            height: iconContainer['2xl'],
            borderRadius: borderRadius.xl,
            backgroundColor: colors.glass.faint,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xl,
          }}
        >
          <Ionicons name="cart-outline" size={40} color={colors.content.body} />
        </View>
      )}
      <Text
        style={{
          color: colors.content.body,
          fontSize: fontSize['xl-2xl'],
          fontFamily: fonts.bodySemibold,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: colors.content.tertiary,
          fontSize: fontSize.xl,
          marginTop: spacing.sm,
          textAlign: 'center',
          lineHeight: lineHeight.lg,
          maxWidth: 280,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
};
