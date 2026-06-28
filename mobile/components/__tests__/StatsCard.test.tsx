import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StatsCard } from '../grocery/StatsCard';

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'grocery.hiddenAtHome') {
        return `${params?.count} item(s) hidden (at home)`;
      }
      if (key === 'grocery.hiddenAtHomeDetails') {
        return `Hidden items:\n\n${params?.items}`;
      }
      return key;
    },
  }),
}));

describe('StatsCard', () => {
  it('shows hidden generated items in the help popup', () => {
    render(
      <StatsCard
        itemsToBuy={3}
        checkedItemsToBuy={1}
        totalItems={4}
        hiddenAtHomeCount={2}
        hiddenAtHomeItems={['grön sparris', 'pepparrot']}
        showAddItem={false}
        deleteMode={false}
        reorderMode={false}
        deleteSelection={new Set()}
        mealPlanItemNames={[]}
        manualItemNames={[]}
        onToggleAddItem={vi.fn()}
        onToggleDeleteMode={vi.fn()}
        onToggleReorderMode={vi.fn()}
        onSelectionChange={vi.fn()}
        onDeleteSelected={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('help-tip-toggle'));

    expect(screen.getByText(/Hidden items:/)).toBeDefined();
    expect(screen.getByText(/grön sparris/)).toBeDefined();
    expect(screen.getByText(/pepparrot/)).toBeDefined();
  });
});
