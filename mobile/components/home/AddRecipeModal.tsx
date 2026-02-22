import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BottomSheetModal, Button } from '@/components';
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
        <View
          style={{
            backgroundColor: colors.input.bg,
            borderRadius: borderRadius.md,
            padding: spacing.xs,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="link-outline"
            size={18}
            color={colors.content.secondary}
            style={{ marginLeft: spacing.md }}
          />
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: spacing['sm-md'],
              paddingVertical: spacing.md,
              fontSize: fontSize.md,
              color: colors.input.text,
            }}
            placeholder={t('home.addRecipe.placeholder')}
            placeholderTextColor={colors.input.placeholder}
            value={recipeUrl}
            onChangeText={setRecipeUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
          <Button
            variant="primary"
            onPress={handleSubmit}
            disabled={!recipeUrl.trim()}
            label={t('home.addRecipe.importButton')}
            tone="primary"
            size="sm"
            style={{
              borderRadius: borderRadius.sm,
              paddingVertical: spacing['sm-md'],
              paddingHorizontal: spacing['md-lg'],
              marginRight: spacing['2xs'],
            }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: spacing.sm,
        }}
      >
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: colors.surface.dividerSolid,
          }}
        />
        <Text
          style={{
            color: colors.content.secondary,
            fontSize: fontSize.sm,
            marginHorizontal: spacing.md,
          }}
        >
          {t('common.or')}
        </Text>
        <View
          style={{
            flex: 1,
            height: 1,
            backgroundColor: colors.surface.dividerSolid,
          }}
        />
      </View>

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
