import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  spacing,
} from '@/lib/theme';
import type { Household } from '@/lib/types';

interface HouseholdTransferProps {
  households: Household[];
  editHouseholdId: string | null;
  isTransferring: boolean;
  t: TFunction;
  onTransfer: (targetHouseholdId: string) => void;
}

export const HouseholdTransfer = ({
  households,
  editHouseholdId,
  isTransferring,
  t,
  onTransfer,
}: HouseholdTransferProps) => (
  <View style={{ marginBottom: spacing.xl }}>
    <Text
      style={{
        fontSize: fontSize.lg,
        fontFamily: fontFamily.bodySemibold,
        color: colors.gray[500],
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: letterSpacing.wide,
      }}
    >
      {t('recipe.household')}
    </Text>
    <Text
      style={{
        fontSize: fontSize.sm,
        fontFamily: fontFamily.body,
        color: colors.gray[400],
        marginBottom: spacing.md,
      }}
    >
      {t('recipe.transferDescription')}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {households.map((household) => {
        const isCurrentHousehold = editHouseholdId === household.id;
        return (
          <Pressable
            key={household.id}
            onPress={() => !isCurrentHousehold && onTransfer(household.id)}
            disabled={isCurrentHousehold || isTransferring}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isCurrentHousehold
                ? colors.primary
                : pressed
                  ? colors.bgMid
                  : colors.gray[50],
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: isCurrentHousehold ? colors.primary : colors.bgDark,
              opacity: isTransferring && !isCurrentHousehold ? 0.5 : 1,
            })}
          >
            {isCurrentHousehold && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.white}
                style={{ marginRight: spacing.xs }}
              />
            )}
            <Text
              style={{
                fontSize: fontSize.lg,
                fontFamily: fontFamily.bodyMedium,
                color: isCurrentHousehold ? colors.white : colors.text.inverse,
              }}
            >
              {household.name}
            </Text>
          </Pressable>
        );
      })}
      {!editHouseholdId && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.gray[200],
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.gray[300],
          }}
        >
          <Ionicons
            name="help-circle-outline"
            size={16}
            color={colors.gray[500]}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fontFamily.bodyMedium,
              color: colors.gray[500],
            }}
          >
            {t('recipe.unassigned')}
          </Text>
        </View>
      )}
    </View>
    {isTransferring && (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: spacing.sm,
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <Text
          style={{
            fontSize: fontSize.sm,
            fontFamily: fontFamily.body,
            color: colors.gray[400],
            marginLeft: spacing.xs,
          }}
        >
          {t('recipe.transferring')}
        </Text>
      </View>
    )}
  </View>
);
