import { Pressable, View } from 'react-native';
import { ThemeIcon } from '@/components/ThemeIcon';
import { useTranslation } from '@/lib/i18n';
import { spacing, useTheme } from '@/lib/theme';

interface ThumbRatingProps {
  rating: number | null;
  hidden: boolean;
  onThumbUp: () => void;
  onThumbDown: () => void;
  size?: number;
}

export const ThumbRating = ({
  rating,
  hidden,
  onThumbUp,
  onThumbDown,
  size = 28,
}: ThumbRatingProps) => {
  const { colors, borderRadius } = useTheme();
  const { t } = useTranslation();
  const isThumbUp = rating === 5;
  const isThumbDown = hidden;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Pressable
        onPress={onThumbDown}
        accessibilityLabel={t('recipe.rateDown')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: borderRadius.lg,
          backgroundColor: isThumbDown
            ? colors.rating.negativeBg
            : pressed
              ? colors.border
              : 'transparent',
        })}
      >
        <ThemeIcon
          name={isThumbDown ? 'thumbs-down' : 'thumbs-down-outline'}
          size={size}
          color={colors.white}
        />
      </Pressable>
      <Pressable
        onPress={onThumbUp}
        accessibilityLabel={t('recipe.rateUp')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: borderRadius.lg,
          backgroundColor: isThumbUp
            ? colors.rating.positiveBg
            : pressed
              ? colors.border
              : 'transparent',
        })}
      >
        <ThemeIcon
          name={isThumbUp ? 'thumbs-up' : 'thumbs-up-outline'}
          size={size}
          color={colors.white}
        />
      </Pressable>
    </View>
  );
};
