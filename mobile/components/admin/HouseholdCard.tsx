import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
} from '@/lib/theme';
import type { Household } from '@/lib/types';

interface HouseholdCardProps {
  household: Household;
  onPress: () => void;
}

export const HouseholdCard = ({ household, onPress }: HouseholdCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.bgMid : colors.glass.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.sm,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: colors.text.inverse,
            }}
          >
            {household.name}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.text.inverse + '99',
              marginTop: 2,
            }}
          >
            ID: {household.id}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.inverse + '80'}
        />
      </View>
    </Pressable>
  );
};
