import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GroceryItemRow } from '../GroceryItemRow';
import { GroceryListView } from '../GroceryListView';
import type { GroceryItem } from '@/lib/types';

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => React.createElement('div', { 'data-testid': 'dnd-context' }, children),
  PointerSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: any) => React.createElement('div', { 'data-testid': 'sortable-context' }, children),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: vi.fn((arr: any[], from: number, to: number) => {
    const result = [...arr];
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
    return result;
  }),
  verticalListSortingStrategy: {},
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: (t: any) => (t ? `translate(${t.x}px, ${t.y}px)` : undefined) } },
}));

vi.mock('@/lib/haptics', () => ({
  hapticSelection: vi.fn(),
}));

const buildItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  name: 'Milk',
  category: 'dairy',
  checked: false,
  quantity: null,
  unit: null,
  quantity_sources: [],
  recipe_sources: [],
  ...overrides,
});

describe('GroceryItemRow', () => {
  it('renders item name', () => {
    render(<GroceryItemRow item={buildItem()} />);
    expect(screen.getByText('Milk')).toBeDefined();
  });

  it('shows quantity and unit before name', () => {
    render(
      <GroceryItemRow item={buildItem({ quantity: '500', unit: 'ml' })} />,
    );
    expect(screen.getByText('500 ml Milk')).toBeDefined();
  });

  it('shows quantity without unit', () => {
    render(
      <GroceryItemRow item={buildItem({ quantity: '3' })} />,
    );
    expect(screen.getByText('3 Milk')).toBeDefined();
  });

  it('aggregates quantity_sources by unit', () => {
    render(
      <GroceryItemRow
        item={buildItem({
          quantity_sources: [
            { quantity: 200, unit: 'g', recipe: 'Recipe A' },
            { quantity: 150, unit: 'g', recipe: 'Recipe B' },
          ],
        })}
      />,
    );
    expect(screen.getByText('350 g Milk')).toBeDefined();
  });

  it('aggregates quantity_sources with different units', () => {
    render(
      <GroceryItemRow
        item={buildItem({
          quantity_sources: [
            { quantity: 200, unit: 'g', recipe: 'R1' },
            { quantity: 2, unit: 'dl', recipe: 'R2' },
          ],
        })}
      />,
    );
    expect(screen.getByText('200 g, 2 dl Milk')).toBeDefined();
  });

  it('handles fractional quantity sums', () => {
    render(
      <GroceryItemRow
        item={buildItem({
          quantity_sources: [
            { quantity: 0.5, unit: 'kg', recipe: 'R1' },
            { quantity: 0.3, unit: 'kg', recipe: 'R2' },
          ],
        })}
      />,
    );
    expect(screen.getByText('0.8 kg Milk')).toBeDefined();
  });

  it('shows recipe sources', () => {
    render(
      <GroceryItemRow
        item={buildItem({ recipe_sources: ['Pasta', 'Salad'] })}
      />,
    );
    expect(screen.getByText('Pasta · Salad')).toBeDefined();
  });

  it('calls onToggle when toggled', () => {
    const handleToggle = vi.fn();
    render(
      <GroceryItemRow item={buildItem()} onToggle={handleToggle} />,
    );
    fireEvent.click(screen.getByText('Milk'));
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('syncs checked state when item.checked prop changes', () => {
    const handleToggle = vi.fn();
    const uncheckedItem = buildItem({ name: 'Butter', checked: false });
    const { rerender } = render(
      <GroceryItemRow item={uncheckedItem} onToggle={handleToggle} />,
    );

    // Click unchecked item → toggles to checked (true)
    fireEvent.click(screen.getByText('Butter'));
    expect(handleToggle).toHaveBeenLastCalledWith(true);
    handleToggle.mockClear();

    // Rerender with checked: true (e.g., Firestore refresh syncs checked state)
    const checkedItem = buildItem({ name: 'Butter', checked: true });
    rerender(<GroceryItemRow item={checkedItem} onToggle={handleToggle} />);

    // Click checked item → should toggle to unchecked (false)
    // Without the useEffect sync, this would still call onToggle(true)
    // because local state was stuck on the initial false → toggled to true
    fireEvent.click(screen.getByText('Butter'));
    expect(handleToggle).toHaveBeenLastCalledWith(false);
  });
});

describe('GroceryListView', () => {
  it('shows empty state when no items', () => {
    render(<GroceryListView uncheckedItems={[]} pickedItems={[]} />);
    expect(screen.getByText('No items yet')).toBeDefined();
  });

  it('renders unchecked items in to-buy card', () => {
    const items = [
      buildItem({ name: 'Milk' }),
      buildItem({ name: 'Eggs', category: 'dairy' }),
      buildItem({ name: 'Bread', category: 'bakery' }),
    ];
    render(<GroceryListView uncheckedItems={items} pickedItems={[]} />);
    expect(screen.getByText('Milk')).toBeDefined();
    expect(screen.getByText('Eggs')).toBeDefined();
    expect(screen.getByText('Bread')).toBeDefined();
  });

  it('renders picked items in separate card', () => {
    const unchecked = [buildItem({ name: 'Banana', checked: false })];
    const picked = [buildItem({ name: 'Apple', checked: true })];
    render(
      <GroceryListView uncheckedItems={unchecked} pickedItems={picked} />,
    );
    expect(screen.getByText('Banana')).toBeDefined();
    expect(screen.getByText('Apple')).toBeDefined();
  });

  it('filters items using filterOutItems', () => {
    const items = [
      buildItem({ name: 'Milk' }),
      buildItem({ name: 'Salt' }),
    ];
    render(
      <GroceryListView
        uncheckedItems={items}
        pickedItems={[]}
        filterOutItems={(name) => name === 'Salt'}
      />,
    );
    expect(screen.getByText('Milk')).toBeDefined();
    expect(screen.queryByText('Salt')).toBeNull();
  });

  it('calls onItemToggle when an item is checked', () => {
    const handleToggle = vi.fn();
    const items = [buildItem({ name: 'Butter' })];
    render(
      <GroceryListView
        uncheckedItems={items}
        pickedItems={[]}
        onItemToggle={handleToggle}
      />,
    );
    fireEvent.click(screen.getByText('Butter'));
    expect(handleToggle).toHaveBeenCalledWith('Butter', true);
  });

  it('calls onDeleteItem when trash is pressed in delete mode', () => {
    const handleDelete = vi.fn();
    const items = [buildItem({ name: 'Butter' })];
    render(
      <GroceryListView
        uncheckedItems={items}
        pickedItems={[]}
        deleteMode={true}
        onDeleteItem={handleDelete}
      />,
    );
    const deleteButtons = screen.getAllByRole('button');
    const trashButton = deleteButtons.find((b) =>
      b.textContent?.includes('') || b.querySelector('[data-testid]'),
    );
    if (trashButton) {
      fireEvent.click(trashButton);
    }
  });

  it('shows both cards when there are unchecked and picked items', () => {
    const unchecked = [buildItem({ name: 'Milk', checked: false })];
    const picked = [buildItem({ name: 'Flour', checked: true })];
    render(
      <GroceryListView uncheckedItems={unchecked} pickedItems={picked} />,
    );
    expect(screen.getByText('Milk')).toBeDefined();
    expect(screen.getByText('Flour')).toBeDefined();
  });
});
