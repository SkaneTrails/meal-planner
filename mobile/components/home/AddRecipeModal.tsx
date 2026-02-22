import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetModal, Divider, UrlInputBar } from '@/components';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { fontSize, iconContainer, spacing, useTheme } from '@/lib/theme';

type Data = ReturnType<typeof useHomeScreenData>;

interface AddRecipeModalProps {
  visible: Data['showAddModal'];
  onClose: () => void;
  recipeUrl: Data['recipeUrl'];
  setRecipeUrl: Data['setRecipeUrl'];
  onImport: Data['handleImportRecipe'];
  t: Data['t'];
}

export const AddRecipeModal = ({
  visible,
  onClose,
  recipeUrl,
  setRecipeUrl,
  onImport,
  t,
}: AddRecipeModalProps) => {
  const { colors, fonts, borderRadius } = useTheme();
  const router = useRouter();

  const handleSubmit = () => {
    if (recipeUrl.trim()) {
      onClose();
      onImport();
    }
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('home.addRecipe.title')}
    >
      <View style={{ marginBottom: spacing.md }}>
        <UrlInputBar
          value={recipeUrl}
          onChangeText={setRecipeUrl}
          onSubmit={handleSubmit}
          placeholder={t('home.addRecipe.placeholder')}
          submitLabel={t('home.addRecipe.importButton')}
        />
      </View>

      <Divider label={t('common.or')} />

      <Pressable
        onPress={() => {
          onClose();
          router.push({ pathname: '/add-recipe', params: { manual: 'true' } });
        }}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.lg,
          backgroundColor: pressed ? colors.text.light : 'transparent',
        })}
      >
        <View
          style={{
            width: iconContainer.md,
            height: iconContainer.md,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.surface.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing['md-lg'],
          }}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={colors.content.body}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fonts.bodySemibold,
              color: colors.content.body,
            }}
          >
            {t('home.addRecipe.manualEntry')}
          </Text>
          <Text
            style={{
              fontSize: fontSize.sm,
              color: colors.content.secondary,
              marginTop: spacing['2xs'],
            }}
          >
            {t('home.addRecipe.manualEntryDesc')}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.content.secondary}
        />
      </Pressable>
    </BottomSheetModal>
  );
};
