import { showAlert } from '@/lib/alert';
import type { MealType } from '@/lib/types';

export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200';

/** Approximate height of each day section (header + 2 meal cards) for scroll positioning */
export const DAY_SECTION_HEIGHT = 180;

export interface MealTypeOption {
  type: MealType;
  label: string;
}

export const showConfirmDelete = (
  title: string,
  message: string,
  onConfirm: () => void,
  cancelText: string,
  removeText: string,
) => {
  showAlert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: removeText, style: 'destructive', onPress: onConfirm },
  ]);
};
