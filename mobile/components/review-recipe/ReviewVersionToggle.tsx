import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { TFunction } from '@/lib/i18n';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  letterSpacing,
  shadows,
  spacing,
} from '@/lib/theme';

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
}: ReviewVersionToggleProps) => (
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
      {t('reviewRecipe.version')}
    </Text>
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.xs,
        ...shadows.sm,
      }}
    >
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
            fontFamily: fontFamily.bodyMedium,
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
            selectedTab === 'enhanced' ? colors.accent : 'transparent',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.xs,
        }}
      >
        <Ionicons
          name="sparkles"
          size={16}
          color={selectedTab === 'enhanced' ? colors.white : colors.accent}
        />
        <Text
          style={{
            fontSize: fontSize.lg,
            fontFamily: fontFamily.bodyMedium,
            color:
              selectedTab === 'enhanced' ? colors.white : colors.text.inverse,
          }}
        >
          {t('reviewRecipe.enhanced')}
        </Text>
      </Pressable>
    </View>
  </View>
);
