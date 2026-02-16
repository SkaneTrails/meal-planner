import { Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '@/lib/theme';

interface RecipeTagsProps {
  tags: string[];
}

export const RecipeTags = ({ tags }: RecipeTagsProps) => {
  if (tags.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.lg,
        gap: spacing.sm,
      }}
    >
      {tags.map((tag) => (
        <View
          key={tag}
          style={{
            backgroundColor: 'rgba(93, 78, 64, 0.65)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: borderRadius.lg,
          }}
        >
          <Text
            style={{
              fontSize: fontSize.base,
              fontFamily: fontFamily.bodySemibold,
              color: colors.white,
            }}
          >
            #{tag}
          </Text>
        </View>
      ))}
    </View>
  );
};
