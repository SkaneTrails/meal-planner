import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { colors, spacing } from '@/lib/theme';

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
  const isThumbUp = rating === 5;
  const isThumbDown = hidden;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Pressable
        onPress={onThumbDown}
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: 20,
          backgroundColor: isThumbDown
            ? colors.rating.negativeBg
            : pressed
              ? colors.border
              : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbDown ? 'thumbs-down' : 'thumbs-down-outline'}
          size={size}
          color={colors.white}
        />
      </Pressable>
      <Pressable
        onPress={onThumbUp}
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: 20,
          backgroundColor: isThumbUp
            ? colors.rating.positiveBg
            : pressed
              ? colors.border
              : 'transparent',
        })}
      >
        <Ionicons
          name={isThumbUp ? 'thumbs-up' : 'thumbs-up-outline'}
          size={size}
          color={colors.white}
        />
      </Pressable>
    </View>
  );
};
