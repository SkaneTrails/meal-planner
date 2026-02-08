import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/lib/theme';

interface ThumbRatingProps {
  rating: number | null;
  onThumbUp: () => void;
  onThumbDown: () => void;
  size?: number;
}

export const ThumbRating = ({ rating, onThumbUp, onThumbDown, size = 28 }: ThumbRatingProps) => {
  const isThumbUp = rating === 5;
  const isThumbDown = rating === 1;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Pressable
        onPress={onThumbDown}
        style={({ pressed }) => ({
          padding: spacing.sm,
          borderRadius: 20,
          backgroundColor: isThumbDown ? 'rgba(239, 83, 80, 0.3)' : pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
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
          backgroundColor: isThumbUp ? 'rgba(76, 175, 80, 0.3)' : pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
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
