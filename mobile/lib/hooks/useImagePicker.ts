import * as ImagePicker from 'expo-image-picker';
import { showAlert, showNotification, type AlertButton } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';

interface ImagePickerOptions {
  /** Aspect ratio for cropping. Default: [4, 3] */
  aspect?: [number, number];
  /** Include an "Enter URL" option in the alert. Default: false */
  showUrlOption?: boolean;
  /** Called when the URL option is selected (only if showUrlOption is true) */
  onUrlOptionSelected?: () => void;
}

interface UseImagePickerReturn {
  pickImage: () => void;
}

const useImagePicker = (
  onImageSelected: (uri: string) => void,
  options?: ImagePickerOptions,
): UseImagePickerReturn => {
  const { t } = useTranslation();
  const aspect = options?.aspect ?? [4, 3];

  const pickImage = () => {
    const buttons: AlertButton[] = [
      {
        text: t('recipe.takePhoto'),
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            showNotification(t('recipe.permissionNeeded'), t('recipe.cameraPermission'));
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            onImageSelected(result.assets[0].uri);
          }
        },
      },
      {
        text: t('recipe.chooseFromLibrary'),
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            showNotification(t('recipe.permissionNeeded'), t('recipe.libraryPermission'));
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            onImageSelected(result.assets[0].uri);
          }
        },
      },
    ];

    if (options?.showUrlOption && options.onUrlOptionSelected) {
      buttons.push({
        text: t('recipe.enterUrl'),
        onPress: options.onUrlOptionSelected,
      });
    }

    buttons.push({ text: t('common.cancel'), style: 'cancel' });

    showAlert(t('recipe.changePhoto'), t('recipe.chooseOption'), buttons);
  };

  return { pickImage };
};

export { useImagePicker };
export type { ImagePickerOptions, UseImagePickerReturn };
