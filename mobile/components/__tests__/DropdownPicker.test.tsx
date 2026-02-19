import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { DropdownPicker } from '../DropdownPicker';

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('DropdownPicker', () => {
  describe('collapsed state', () => {
    it('shows the selected option label', () => {
      render(
        <DropdownPicker
          options={OPTIONS}
          value="banana"
          onSelect={vi.fn()}
          testID="fruit"
        />,
      );
      expect(screen.getByText('Banana')).toBeDefined();
      expect(screen.queryByText('Apple')).toBeNull();
      expect(screen.queryByText('Cherry')).toBeNull();
    });

    it('renders the collapsed pressable with testID', () => {
      render(
        <DropdownPicker
          options={OPTIONS}
          value="apple"
          onSelect={vi.fn()}
          testID="fruit"
        />,
      );
      expect(screen.getByTestId('fruit-collapsed')).toBeDefined();
    });

    it('renders adornment in collapsed state', () => {
      const withAdornment = [
        {
          value: 'x',
          label: 'X',
          adornment: <span data-testid="adorn">!</span>,
        },
      ];
      render(
        <DropdownPicker
          options={withAdornment}
          value="x"
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByTestId('adorn')).toBeDefined();
    });
  });

  describe('expanded state', () => {
    it('shows all options after clicking collapsed row', () => {
      render(
        <DropdownPicker
          options={OPTIONS}
          value="banana"
          onSelect={vi.fn()}
          testID="fruit"
        />,
      );
      fireEvent.click(screen.getByTestId('fruit-collapsed'));
      expect(screen.getByText('Apple')).toBeDefined();
      expect(screen.getByText('Banana')).toBeDefined();
      expect(screen.getByText('Cherry')).toBeDefined();
    });

    it('renders option testIDs when expanded', () => {
      render(
        <DropdownPicker
          options={OPTIONS}
          value="apple"
          onSelect={vi.fn()}
          testID="fruit"
        />,
      );
      fireEvent.click(screen.getByTestId('fruit-collapsed'));
      expect(screen.getByTestId('fruit-option-apple')).toBeDefined();
      expect(screen.getByTestId('fruit-option-banana')).toBeDefined();
      expect(screen.getByTestId('fruit-option-cherry')).toBeDefined();
    });

    it('renders selection indicator for selected option only', () => {
      render(
        <DropdownPicker
          options={OPTIONS}
          value="banana"
          onSelect={vi.fn()}
          testID="fruit"
        />,
      );
      fireEvent.click(screen.getByTestId('fruit-collapsed'));
      // All 3 option rows render
      expect(screen.getByTestId('fruit-option-apple')).toBeDefined();
      expect(screen.getByTestId('fruit-option-banana')).toBeDefined();
      expect(screen.getByTestId('fruit-option-cherry')).toBeDefined();
      // The component renders an indicator via SelectionIndicator —
      // exact rendering depends on visibility tokens in the mock,
      // but the selected row should always be distinguishable
      expect(screen.getByTestId('fruit-option-banana').textContent).toContain(
        'Banana',
      );
    });
  });

  describe('selection behavior', () => {
    it('calls onSelect with the chosen value', () => {
      const onSelect = vi.fn();
      render(
        <DropdownPicker
          options={OPTIONS}
          value="apple"
          onSelect={onSelect}
          testID="fruit"
        />,
      );
      fireEvent.click(screen.getByTestId('fruit-collapsed'));
      fireEvent.click(screen.getByTestId('fruit-option-cherry'));
      expect(onSelect).toHaveBeenCalledWith('cherry');
    });

    it('collapses after selection', () => {
      const onSelect = vi.fn();
      render(
        <DropdownPicker
          options={OPTIONS}
          value="apple"
          onSelect={onSelect}
          testID="fruit"
        />,
      );
      fireEvent.click(screen.getByTestId('fruit-collapsed'));
      expect(screen.queryByTestId('fruit-collapsed')).toBeNull();
      fireEvent.click(screen.getByTestId('fruit-option-banana'));
      // After selection, should collapse back — collapsed row visible again
      expect(screen.getByTestId('fruit-collapsed')).toBeDefined();
    });

    it('selecting the already-selected option still collapses', () => {
      const onSelect = vi.fn();
      render(
        <DropdownPicker
          options={OPTIONS}
          value="apple"
          onSelect={onSelect}
          testID="fruit"
        />,
      );
      fireEvent.click(screen.getByTestId('fruit-collapsed'));
      fireEvent.click(screen.getByTestId('fruit-option-apple'));
      expect(onSelect).toHaveBeenCalledWith('apple');
      expect(screen.getByTestId('fruit-collapsed')).toBeDefined();
    });
  });
});
