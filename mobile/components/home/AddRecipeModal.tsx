import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { BottomSheetModal } from '@/components';
import type { useHomeScreenData } from '@/lib/hooks/useHomeScreenData';
import { borderRadius, colors, fontFamily, fontSize } from '@/lib/theme';

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
      backgroundColor="#F5EDE5"
      scrollable={false}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: borderRadius.md,
            padding: 4,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="link-outline"
            size={18}
            color="#8B7355"
            style={{ marginLeft: 12 }}
          />
          <TextInput
            style={{
              flex: 1,
              paddingHorizontal: 10,
              paddingVertical: 12,
              fontSize: fontSize.md,
              color: '#5D4E40',
            }}
            placeholder={t('home.addRecipe.placeholder')}
            placeholderTextColor="#A89585"
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
                : 'rgba(93, 78, 64, 0.15)',
              borderRadius: borderRadius.sm,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginRight: 2,
            })}
          >
            <Text
              style={{
                color: recipeUrl.trim() ? colors.white : '#8B7355',
                fontSize: fontSize.sm,
                fontFamily: fontFamily.bodySemibold,
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
        <View style={{ flex: 1, height: 1, backgroundColor: '#D4C5B5' }} />
        <Text
          style={{
            color: '#8B7355',
            fontSize: fontSize.sm,
            marginHorizontal: 12,
          }}
        >
          {t('common.or')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#D4C5B5' }} />
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
          backgroundColor: pressed ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(139, 115, 85, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Ionicons name="create-outline" size={20} color="#5D4E40" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.md,
              fontFamily: fontFamily.bodySemibold,
              color: '#5D4E40',
            }}
          >
            {t('home.addRecipe.manualEntry')}
          </Text>
          <Text
            style={{ fontSize: fontSize.sm, color: '#8B7355', marginTop: 2 }}
          >
            {t('home.addRecipe.manualEntryDesc')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8B7355" />
      </Pressable>
    </BottomSheetModal>
  );
};
