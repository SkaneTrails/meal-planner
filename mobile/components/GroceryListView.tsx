/**
 * Grocery list inside a single ContentCard with two independently
 * collapsible sections: "To Buy" (unchecked) and "Picked" (checked).
 * Reorder mode uses @dnd-kit for web-compatible drag-and-drop.
 */

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from '@/lib/i18n';
import { handleScrollEvent } from '@/lib/tab-bar-scroll';
import { fontSize, iconSize, layout, spacing, useTheme } from '@/lib/theme';
import type { GroceryItem } from '@/lib/types';
import { ContentCard } from './ContentCard';
import { GroceryItemRow } from './GroceryItemRow';
import { EmptyGroceryState } from './grocery/EmptyGroceryState';
import { ThemeIcon } from './ThemeIcon';

interface SortableItemProps {
  item: GroceryItem;
  deleteMode: boolean;
  onToggle?: (checked: boolean) => void;
  onDelete?: () => void;
}

const SortableItem = ({
  item,
  deleteMode,
  onToggle,
  onDelete,
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.name });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GroceryItemRow
        item={item}
        onToggle={onToggle}
        onDelete={onDelete}
        deleteMode={deleteMode}
        showReorder={true}
        dragListeners={listeners}
        dragAttributes={attributes as unknown as Record<string, unknown>}
      />
    </div>
  );
};

interface GroceryListViewProps {
  uncheckedItems: GroceryItem[];
  pickedItems: GroceryItem[];
  deleteMode?: boolean;
  reorderMode?: boolean;
  onItemToggle?: (itemName: string, checked: boolean) => void;
  onDeleteItem?: (itemName: string) => void;
  filterOutItems?: (item: GroceryItem) => boolean;
  onReorder?: (items: GroceryItem[]) => void;
}

export const GroceryListView = ({
  uncheckedItems,
  pickedItems,
  deleteMode = false,
  reorderMode = false,
  onItemToggle,
  onDeleteItem,
  filterOutItems,
  onReorder,
}: GroceryListViewProps) => {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const [orderedItems, setOrderedItems] = useState<GroceryItem[]>([]);
  const orderedItemsRef = useRef<GroceryItem[]>([]);
  const prevReorderRef = useRef(reorderMode);
  const [toBuyCollapsed, setToBuyCollapsed] = useState(false);
  const [pickedCollapsed, setPickedCollapsed] = useState(false);

  const filteredUnchecked = filterOutItems
    ? uncheckedItems.filter((item) => !filterOutItems(item))
    : uncheckedItems;

  const filteredPicked = filterOutItems
    ? pickedItems.filter((item) => !filterOutItems(item))
    : pickedItems;

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only fire on reorderMode transitions
  useEffect(() => {
    const wasReordering = prevReorderRef.current;
    prevReorderRef.current = reorderMode;

    if (reorderMode && !wasReordering) {
      const items = [...filteredUnchecked];
      setOrderedItems(items);
      orderedItemsRef.current = items;
    } else if (!reorderMode && wasReordering && onReorder) {
      onReorder(orderedItemsRef.current);
    }
  }, [reorderMode]);

  const displayUnchecked =
    reorderMode && orderedItems.length > 0 ? orderedItems : filteredUnchecked;

  const sortableIds = useMemo(
    () => orderedItems.map((item) => item.name),
    [orderedItems],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((i) => i.name === active.id);
    const newIndex = orderedItems.findIndex((i) => i.name === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(orderedItems, oldIndex, newIndex);
    setOrderedItems(reordered);
    orderedItemsRef.current = reordered;
  };

  if (filteredUnchecked.length === 0 && filteredPicked.length === 0) {
    return (
      <EmptyGroceryState
        title={t('grocery.noItemsYet')}
        subtitle={t('grocery.emptyFromMealPlan')}
      />
    );
  }

  const toBuyLabel =
    filteredUnchecked.length === 1
      ? t('grocery.itemCountOne')
      : t('grocery.itemCount', { count: filteredUnchecked.length });

  const pickedLabel =
    filteredPicked.length === 1
      ? `${t('grocery.pickedSection')} (1)`
      : `${t('grocery.pickedSection')} (${filteredPicked.length})`;

  const renderItemList = (items: GroceryItem[]) =>
    items.map((item) => (
      <GroceryItemRow
        key={item.name}
        item={item}
        onToggle={(checked) => onItemToggle?.(item.name, checked)}
        onDelete={onDeleteItem ? () => onDeleteItem(item.name) : undefined}
        deleteMode={deleteMode}
        showReorder={false}
      />
    ));

  const renderToBuyContent = () => {
    if (reorderMode && orderedItems.length > 0) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Text
            style={{
              fontSize: fontSize.base,
              fontFamily: fonts.body,
              color: colors.content.tertiary,
              marginBottom: spacing['sm-md'],
              fontStyle: 'italic',
            }}
          >
            {t('grocery.reorderHintMobile')}
          </Text>
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            {orderedItems.map((item) => (
              <SortableItem
                key={item.name}
                item={item}
                deleteMode={deleteMode}
                onToggle={(checked) => onItemToggle?.(item.name, checked)}
                onDelete={
                  onDeleteItem ? () => onDeleteItem(item.name) : undefined
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      );
    }
    return renderItemList(displayUnchecked);
  };

  const SectionHeader = ({
    label,
    collapsed,
    onToggle,
  }: {
    label: string;
    collapsed: boolean;
    onToggle: () => void;
  }) => (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: !collapsed }}
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.bodySemibold,
          fontSize: fontSize.sm,
          color: colors.content.heading,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <ThemeIcon
        name={collapsed ? 'chevron-down' : 'chevron-up'}
        size={iconSize.sm}
        color={colors.content.subtitle}
      />
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: layout.tabBar.contentBottomPadding,
      }}
      onScroll={handleScrollEvent}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <ContentCard>
        {filteredUnchecked.length > 0 && (
          <View>
            <SectionHeader
              label={toBuyLabel}
              collapsed={toBuyCollapsed}
              onToggle={() => setToBuyCollapsed((p) => !p)}
            />
            {!toBuyCollapsed && renderToBuyContent()}
          </View>
        )}

        {filteredUnchecked.length > 0 && filteredPicked.length > 0 && (
          <View
            style={{
              height: 1,
              backgroundColor: colors.card.borderColor,
              marginVertical: spacing.sm,
            }}
          />
        )}

        {filteredPicked.length > 0 && (
          <View>
            <SectionHeader
              label={pickedLabel}
              collapsed={pickedCollapsed}
              onToggle={() => setPickedCollapsed((p) => !p)}
            />
            {!pickedCollapsed && renderItemList(filteredPicked)}
          </View>
        )}
      </ContentCard>
    </ScrollView>
  );
};
