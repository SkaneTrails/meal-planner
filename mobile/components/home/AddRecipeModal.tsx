import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BottomSheetModal } from '@/components';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { borderRadius, fontSize, spacing, useTheme } from '@/lib/theme';

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
  const { colors, fonts } = useTheme();
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
      animationType="fade"
      dismissOnBackdropPress
      showDragHandle
      showCloseButton={false}
      backgroundColor={colors.surface.modal}
      scrollable={false}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: colors.glass.subtle,
            borderRadius: borderRadius.md,
            padding: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="link-outline"
            size={18}
            color={colors.content.secondary}
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: spacing['sm-md'],
              paddingVertical: 12,
              fontSize: fontSize.md,
              color: colors.content.body,
            }}
            placeholder={t('home.addRecipe.placeholder')}
            placeholderTextColor={colors.content.placeholder}
            value={recipeUrl}
            onChangeText={setRecipeUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!recipeUrl.trim()}
            style={({ pressed }) => ({
              backgroundColor: recipeUrl.trim()
                ? pressed
                  ? colors.accentDark
                  : colors.accent
                : colors.surface.pressed,
              borderRadius: borderRadius.sm,
              paddingVertical: spacing['sm-md'],
              paddingHorizontal: spacing['md-lg'],
              marginRight: 2,
            })}
          >
            <Text
              style={{
                color: recipeUrl.trim()
                  ? colors.white
                  : colors.content.secondary,
                fontSize: fontSize.sm,
                fontFamily: fonts.bodySemibold,
              }}
            >
              {t('home.addRecipe.importButton')}
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          marginVertical: 8,
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
            marginHorizontal: 12,
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
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: pressed ? colors.text.light : 'transparent',
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: borderRadius.sm,
            backgroundColor: 'rgba(139, 115, 85, 0.1)',
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
              marginTop: 2,
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
