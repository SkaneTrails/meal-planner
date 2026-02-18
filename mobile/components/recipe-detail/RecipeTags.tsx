import { View } from 'react-native';
import { Chip } from '@/components';
import { spacing, useTheme } from '@/lib/theme';

interface RecipeTagsProps {
  tags: string[];
}

export const RecipeTags = ({ tags }: RecipeTagsProps) => {
  const { colors, crt } = useTheme();
  if (tags.length === 0 || crt) return null;

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
        <Chip
          key={tag}
          label={tag}
          variant="display"
          prefix="#"
          bg={colors.chip.bg}
          color={colors.content.body}
        />
      ))}
    </View>
  );
};
