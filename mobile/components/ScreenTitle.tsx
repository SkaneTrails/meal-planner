import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  spacing,
  useTheme,
} from '@/lib/theme';

interface ScreenTitleProps {
  title: string;
  subtitle?: string;
  variant?: 'centered' | 'large';
  style?: StyleProp<ViewStyle>;
}

export const ScreenTitle = ({
  title,
  subtitle,
  variant = 'centered',
  style,
}: ScreenTitleProps) => {
  const { colors } = useTheme();
  const isCentered = variant === 'centered';

  return (
    <View style={style}>
      <Text
        style={[
          isCentered ? styles.centeredTitle : styles.largeTitle,
          isCentered
            ? { color: colors.content.heading }
            : {
                color: colors.text.primary,
                textShadowColor: colors.shadow.text,
              },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            isCentered ? styles.centeredSubtitle : styles.largeSubtitle,
            {
              color: isCentered
                ? colors.content.subtitle
                : colors.text.secondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centeredTitle: {
    fontSize: fontSize['3xl'],
    fontFamily: fontFamily.displayBold,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
    textAlign: 'center',
  },
  centeredSubtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    marginTop: spacing['2xs'],
    textAlign: 'center',
  },
  largeTitle: {
    fontSize: fontSize['4xl'],
    fontFamily: fontFamily.display,
    letterSpacing: letterSpacing.tight,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  largeSubtitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    letterSpacing: letterSpacing.normal,
    marginTop: spacing.xs,
  },
});
