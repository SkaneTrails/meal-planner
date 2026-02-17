import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { showNotification } from '@/lib/alert';
import { useTranslation } from '@/lib/i18n';
import {
  borderRadius,
  circleStyle,
  fontSize,
  fontWeight,
  iconContainer,
  shadows,
  spacing,
  useTheme,
} from '@/lib/theme';

const SUGGESTED_ITEM_KEYS = [
  'salt',
  'pepper',
  'oliveOil',
  'vegetableOil',
  'butter',
  'sugar',
  'flour',
  'garlic',
  'onion',
  'soySauce',
  'vinegar',
  'honey',
  'rice',
  'pasta',
  'eggs',
] as const;

interface ItemsAtHomeSectionProps {
  itemsAtHome: string[];
  onAddItem: (item: string) => Promise<void>;
  onRemoveItem: (item: string) => Promise<void>;
}

export const ItemsAtHomeSection = ({
  itemsAtHome,
  onAddItem,
  onRemoveItem,
}: ItemsAtHomeSectionProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState('');

  const suggestedItems = useMemo(
    () => SUGGESTED_ITEM_KEYS.map((key) => t(`settings.suggestedItems.${key}`)),
    [t],
  );

  const handleAddItem = async () => {
    const item = newItem.trim();
    if (!item) return;
    try {
      await onAddItem(item);
      setNewItem('');
    } catch {
      showNotification(t('common.error'), t('settings.failedToAddItem'));
    }
  };

  const handleRemoveItem = async (item: string) => {
    try {
      await onRemoveItem(item);
    } catch {
      showNotification(t('common.error'), t('settings.failedToRemoveItem'));
    }
  };

  const handleAddSuggested = async (item: string) => {
    if (itemsAtHome.includes(item.toLowerCase())) return;
    try {
      await onAddItem(item);
    } catch {
      showNotification(t('common.error'), t('settings.failedToAddItem'));
    }
  };

  const suggestedNotAdded = suggestedItems.filter(
    (item) => !itemsAtHome.includes(item.toLowerCase()),
  );

  return (
    <>
      {/* Current items */}
      {itemsAtHome.length > 0 && (
        <CurrentItems items={itemsAtHome} onRemove={handleRemoveItem} />
      )}

      {/* Add new item input */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.glass.card,
          borderRadius: borderRadius.md,
          padding: 4,
          marginBottom: spacing.md,
          ...shadows.sm,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: fontSize.md,
            color: colors.content.body,
          }}
          placeholder={t('settings.addItemPlaceholder')}
          placeholderTextColor={colors.content.subtitle}
          value={newItem}
          onChangeText={setNewItem}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAddItem}
          disabled={!newItem.trim()}
          style={({ pressed }) => ({
            backgroundColor: newItem.trim() ? colors.primary : colors.bgDark,
            borderRadius: borderRadius.sm,
            padding: spacing.sm,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons
            name="add"
            size={20}
            color={newItem.trim() ? colors.white : colors.text.inverse + '60'}
          />
        </Pressable>
      </View>

      {/* Suggested items */}
      {suggestedNotAdded.length > 0 && (
        <SuggestedItems items={suggestedNotAdded} onAdd={handleAddSuggested} />
      )}

      {/* Empty state */}
      {itemsAtHome.length === 0 && <EmptyItemsState />}
    </>
  );
};

const CurrentItems = ({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (item: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.strong,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.yourItems', { count: items.length })}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing['xs-sm'],
        }}
      >
        {items.map((item) => (
          <Pressable
            key={item}
            onPress={() => onRemove(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.errorBg : colors.bgDark,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              gap: 4,
            })}
          >
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.content.body,
                textTransform: 'capitalize',
              }}
            >
              {item}
            </Text>
            <Ionicons
              name="close-circle"
              size={14}
              color={colors.content.subtitle}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const SuggestedItems = ({
  items,
  onAdd,
}: {
  items: string[];
  onAdd: (item: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.sm,
      }}
    >
      <Text
        style={{
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          color: colors.content.strong,
          marginBottom: spacing.sm,
        }}
      >
        {t('settings.suggestions')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing['xs-sm'],
        }}
      >
        {items.map((item) => (
          <Pressable
            key={item}
            onPress={() => onAdd(item)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? colors.successBg : 'transparent',
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              borderRadius: borderRadius.full,
              borderWidth: 1,
              borderColor: colors.surface.borderLight,
              borderStyle: 'dashed',
              gap: 4,
            })}
          >
            <Ionicons name="add" size={14} color={colors.content.strong} />
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.content.strong,
              }}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const EmptyItemsState = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: colors.glass.card,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.sm,
        ...shadows.sm,
      }}
    >
      <View
        style={{
          ...circleStyle(iconContainer.lg),
          backgroundColor: colors.bgDark,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons name="basket-outline" size={24} color={colors.content.body} />
      </View>
      <Text
        style={{
          fontSize: fontSize.md,
          fontWeight: fontWeight.semibold,
          color: colors.content.heading,
          marginBottom: 2,
        }}
      >
        {t('settings.noItemsYet')}
      </Text>
      <Text
        style={{
          fontSize: fontSize.sm,
          color: colors.content.strong,
          textAlign: 'center',
        }}
      >
        {t('settings.addItemsHint')}
      </Text>
    </View>
  );
};
