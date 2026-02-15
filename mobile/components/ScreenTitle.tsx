import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, letterSpacing } from '@/lib/theme';

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
  const isCentered = variant === 'centered';

  return (
    <View style={style}>
      <Text style={isCentered ? styles.centeredTitle : styles.largeTitle}>
        {title}
      </Text>
      {subtitle && (
        <Text
          style={isCentered ? styles.centeredSubtitle : styles.largeSubtitle}
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
    fontWeight: '700',
    color: colors.content.heading,
    letterSpacing: letterSpacing.tight,
    textAlign: 'center',
  },
  centeredSubtitle: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.body,
    color: colors.content.subtitle,
    marginTop: 2,
    textAlign: 'center',
  },
  largeTitle: {
    fontSize: fontSize['4xl'],
    fontFamily: fontFamily.display,
    color: colors.text.primary,
    letterSpacing: letterSpacing.tight,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  largeSubtitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.body,
    color: colors.text.secondary,
    marginTop: 4,
  },
});
