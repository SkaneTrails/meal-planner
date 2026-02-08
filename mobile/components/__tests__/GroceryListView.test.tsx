import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GroceryItemRow } from '../GroceryItemRow';
import { GroceryListView } from '../GroceryListView';
import type { GroceryItem, GroceryList } from '@/lib/types';

vi.mock('react-native-draggable-flatlist', () => ({
  default: ({ data, renderItem }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'draggable-list' },
      data.map((item: any, index: number) =>
        React.createElement(React.Fragment, { key: index },
          renderItem({ item, drag: vi.fn(), isActive: false }).props.children,
        ),
      ),
    ),
  ScaleDecorator: ({ children }: any) => children,
}));

vi.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'gesture-root' }, children),
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

const buildList = (items: GroceryItem[]): GroceryList => ({
  id: 'list-1',
  household_id: 'hh-1',
  week_start: '2025-01-13',
  items,
  last_generated: '2025-01-13T10:00:00',
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
            { quantity: 200, unit: 'g', recipe_title: 'Recipe A' },
            { quantity: 150, unit: 'g', recipe_title: 'Recipe B' },
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
            { quantity: 200, unit: 'g', recipe_title: 'R1' },
            { quantity: 2, unit: 'dl', recipe_title: 'R2' },
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
            { quantity: 0.5, unit: 'kg', recipe_title: 'R1' },
            { quantity: 0.3, unit: 'kg', recipe_title: 'R2' },
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
});

describe('GroceryListView', () => {
  it('shows empty state when no items', () => {
    render(<GroceryListView groceryList={buildList([])} />);
    expect(screen.getByText('No items yet')).toBeDefined();
  });

  it('renders all items', () => {
    const items = [
      buildItem({ name: 'Milk' }),
      buildItem({ name: 'Eggs', category: 'dairy' }),
      buildItem({ name: 'Bread', category: 'bakery' }),
    ];
    render(<GroceryListView groceryList={buildList(items)} />);
    expect(screen.getByText('Milk')).toBeDefined();
    expect(screen.getByText('Eggs')).toBeDefined();
    expect(screen.getByText('Bread')).toBeDefined();
  });

  it('sorts checked items to bottom', () => {
    const items = [
      buildItem({ name: 'Apple', checked: true }),
      buildItem({ name: 'Banana', checked: false }),
      buildItem({ name: 'Cherry', checked: false }),
    ];
    const { container } = render(
      <GroceryListView groceryList={buildList(items)} />,
    );
    const texts = Array.from(container.querySelectorAll('[data-component="Text"]'))
      .map((el) => el.textContent)
      .filter((t) => ['Apple', 'Banana', 'Cherry'].includes(t || ''));
    expect(texts).toEqual(['Banana', 'Cherry', 'Apple']);
  });

  it('filters items using filterOutItems', () => {
    const items = [
      buildItem({ name: 'Milk' }),
      buildItem({ name: 'Salt' }),
    ];
    render(
      <GroceryListView
        groceryList={buildList(items)}
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
        groceryList={buildList(items)}
        onItemToggle={handleToggle}
      />,
    );
    fireEvent.click(screen.getByText('Butter'));
    expect(handleToggle).toHaveBeenCalledWith('Butter', true);
  });
});
