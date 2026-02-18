import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SurfaceCard } from '@/components';
import type { TFunction } from '@/lib/i18n';
import { fontSize, letterSpacing, spacing, useTheme } from '@/lib/theme';

type VersionTab = 'original' | 'enhanced';

interface ReviewVersionToggleProps {
  selectedTab: VersionTab;
  onSelectTab: (tab: VersionTab) => void;
  t: TFunction;
}

export const ReviewVersionToggle = ({
  selectedTab,
  onSelectTab,
  t,
}: ReviewVersionToggleProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text
        style={{
          fontSize: fontSize.lg,
          fontFamily: fonts.bodySemibold,
          color: colors.gray[500],
          marginBottom: spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: letterSpacing.wide,
        }}
      >
        {t('reviewRecipe.version')}
      </Text>
      <SurfaceCard padding={spacing.xs} style={{ flexDirection: 'row' }}>
        <Pressable
          onPress={() => onSelectTab('original')}
          style={{
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.sm,
            backgroundColor:
              selectedTab === 'original' ? colors.primary : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodyMedium,
              color:
                selectedTab === 'original' ? colors.white : colors.text.inverse,
            }}
          >
            {t('reviewRecipe.original')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSelectTab('enhanced')}
          style={{
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: borderRadius.sm,
            backgroundColor:
              selectedTab === 'enhanced' ? colors.ai.primary : 'transparent',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: spacing.xs,
          }}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={
              selectedTab === 'enhanced' ? colors.white : colors.ai.primary
            }
          />
          <Text
            style={{
              fontSize: fontSize.lg,
              fontFamily: fonts.bodyMedium,
              color:
                selectedTab === 'enhanced' ? colors.white : colors.text.inverse,
            }}
          >
            {t('reviewRecipe.enhanced')}
          </Text>
        </Pressable>
      </SurfaceCard>
    </View>
  );
};
