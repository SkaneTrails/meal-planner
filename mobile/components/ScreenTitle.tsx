import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import {
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
  const { colors, fonts } = useTheme();
  const isCentered = variant === 'centered';

  return (
    <View style={style}>
      <Text
        style={[
          isCentered ? styles.centeredTitle : styles.largeTitle,
          isCentered
            ? { color: colors.content.heading, fontFamily: fonts.displayBold }
            : {
                color: colors.content.heading,
                textShadowColor: colors.shadow.text,
                fontFamily: fonts.display,
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
                : colors.content.subtitle,
              fontFamily: fonts.body,
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
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
    textAlign: 'center',
  },
  centeredSubtitle: {
    fontSize: fontSize.md,
    marginTop: spacing['2xs'],
    textAlign: 'center',
  },
  largeTitle: {
    fontSize: fontSize['4xl'],
    letterSpacing: letterSpacing.tight,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  largeSubtitle: {
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.normal,
    marginTop: spacing.xs,
  },
});
