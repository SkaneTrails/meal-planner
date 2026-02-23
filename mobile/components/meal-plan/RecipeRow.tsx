import { Image, Pressable, Text, View } from 'react-native';
import { IconButton } from '@/components';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import { PLACEHOLDER_IMAGE } from './meal-plan-constants';

interface RecipeRowProps {
  title: string;
  imageUrl?: string | null;
  subtitle?: string;
  onPress: () => void;
  onRemove: () => void;
}

/**
 * Compact recipe row used in meal-plan slots and extras.
 * Thumbnail + title/subtitle, pressable body, trailing remove button.
 */
export const RecipeRow = ({
  title,
  imageUrl,
  subtitle,
  onPress,
  onRemove,
}: RecipeRowProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const resolvedImage = imageUrl || PLACEHOLDER_IMAGE;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.mealPlan.slotBg,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing['xs-sm'],
      }}
    >
      <Pressable
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
      >
        <Image
          source={{ uri: resolvedImage }}
          style={{
            width: 56,
            height: 56,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.border,
          }}
          resizeMode="cover"
        />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.primary,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: fontSize.sm,
                fontFamily: fonts.body,
                color: colors.content.tertiary,
                marginTop: spacing['2xs'],
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </Pressable>

      <IconButton
        tone="cancel"
        onPress={onRemove}
        icon="close"
        size={28}
        iconSize={18}
        style={{ marginLeft: spacing.sm }}
      />
    </View>
  );
};
