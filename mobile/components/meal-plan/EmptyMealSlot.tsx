import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Button, ButtonGroup, IconCircle } from '@/components';
import { fontSize, spacing, useTheme } from '@/lib/theme';
import type { MealType } from '@/lib/types';

interface EmptyMealSlotProps {
  date: Date;
  mealType: MealType;
  label: string;
  onPress: (
    date: Date,
    mealType: MealType,
    mode: 'library' | 'copy' | 'quick' | 'random',
  ) => void;
}

export const EmptyMealSlot = ({
  date,
  mealType,
  label,
  onPress,
}: EmptyMealSlotProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.mealPlan.emptyBg,
        borderRadius: borderRadius.sm,
        padding: spacing.md,
        marginBottom: spacing['xs-sm'],
      }}
    >
      {/* Label section */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', minWidth: 80 }}
      >
        <IconCircle
          size={26}
          bg={colors.surface.active}
          style={{ marginRight: spacing.sm }}
        >
          <Ionicons name="add" size={16} color={colors.content.subtitle} />
        </IconCircle>
        <Text
          style={{
            fontSize: fontSize.md,
            fontFamily: fonts.bodySemibold,
            color: colors.content.strong,
          }}
        >
          {label}
        </Text>
      </View>

      {/* Actions: icon buttons in a row */}
      <ButtonGroup
        gap={spacing['xs-sm']}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Button
          variant="icon"
          tone="alt"
          icon="book-outline"
          label="Book"
          iconSize={17}
          onPress={() => onPress(date, mealType, 'library')}
          style={{ width: 34, height: 34 }}
        />
        <Button
          variant="icon"
          tone="alt"
          icon="dice-outline"
          label="Random"
          iconSize={17}
          onPress={() => onPress(date, mealType, 'random')}
          style={{ width: 34, height: 34 }}
        />
        <Button
          variant="icon"
          tone="alt"
          icon="copy-outline"
          label="Copy"
          iconSize={17}
          onPress={() => onPress(date, mealType, 'copy')}
          style={{ width: 34, height: 34 }}
        />
        <Button
          variant="icon"
          tone="alt"
          icon="create-outline"
          label="Quick"
          iconSize={17}
          onPress={() => onPress(date, mealType, 'quick')}
          style={{ width: 34, height: 34 }}
        />
      </ButtonGroup>
    </View>
  );
};
