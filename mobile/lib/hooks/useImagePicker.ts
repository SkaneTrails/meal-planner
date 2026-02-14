import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { type AlertButton, showAlert, showNotification } from '@/lib/alert';
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

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showNotification(
        t('recipe.permissionNeeded'),
        t('recipe.libraryPermission'),
      );
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
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showNotification(
        t('recipe.permissionNeeded'),
        t('recipe.cameraPermission'),
      );
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
  };

  const pickImage = () => {
    // On web, window.confirm only supports 2 buttons so the multi-button
    // alert drops options. Launch the file picker directly instead.
    if (Platform.OS === 'web') {
      if (options?.showUrlOption && options.onUrlOptionSelected) {
        const useUrl = window.confirm(
          `${t('recipe.changePhoto')}\n\n${t('recipe.chooseFromLibraryOrUrl')}`,
        );
        if (useUrl) {
          options.onUrlOptionSelected();
        } else {
          launchLibrary();
        }
      } else {
        launchLibrary();
      }
      return;
    }

    const buttons: AlertButton[] = [
      { text: t('recipe.takePhoto'), onPress: launchCamera },
      { text: t('recipe.chooseFromLibrary'), onPress: launchLibrary },
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
