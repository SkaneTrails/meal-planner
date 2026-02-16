import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterChip } from '../FilterChip';

describe('FilterChip', () => {
  it('renders the label text', () => {
    render(<FilterChip label="Veggie" selected={false} onPress={vi.fn()} />);
    expect(screen.getByText('Veggie')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = vi.fn();
    render(<FilterChip label="Fish" selected={false} onPress={onPress} />);
    fireEvent.click(screen.getByText('Fish'));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('renders leading content when provided', () => {
    render(
      <FilterChip
        label="Veggie"
        selected={false}
        onPress={vi.fn()}
        leading={<span data-testid="dot" />}
      />,
    );
    expect(screen.getByTestId('dot')).toBeTruthy();
    expect(screen.getByText('Veggie')).toBeTruthy();
  });

  it('does not render leading content when omitted', () => {
    render(<FilterChip label="All" selected={false} onPress={vi.fn()} />);
    const elements = screen.getAllByText(/./);
    expect(elements).toHaveLength(1);
    expect(elements[0].textContent).toBe('All');
  });

  it('renders in both selected and unselected states', () => {
    const { rerender } = render(
      <FilterChip label="Meat" selected={false} onPress={vi.fn()} />,
    );
    expect(screen.getByText('Meat')).toBeTruthy();

    rerender(
      <FilterChip label="Meat" selected={true} onPress={vi.fn()} />,
    );
    expect(screen.getByText('Meat')).toBeTruthy();
  });

  it('accepts activeColor prop without crashing', () => {
    expect(() =>
      render(
        <FilterChip label="All" selected={true} onPress={vi.fn()} activeColor="#B85C38" />,
      ),
    ).not.toThrow();
  });

  it('accepts custom labelStyle prop without crashing', () => {
    expect(() =>
      render(
        <FilterChip
          label="Custom"
          selected={false}
          onPress={vi.fn()}
          labelStyle={{ fontSize: 18 }}
        />,
      ),
    ).not.toThrow();
  });
});
