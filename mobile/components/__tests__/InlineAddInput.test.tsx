import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { InlineAddInput } from '../InlineAddInput';

describe('InlineAddInput', () => {
  it('renders placeholder text', () => {
    render(
      <InlineAddInput
        value=""
        onChangeText={vi.fn()}
        onSubmit={vi.fn()}
        placeholder="Add item..."
      />,
    );
    expect(screen.getByPlaceholderText('Add item...')).toBeDefined();
  });

  it('calls onChangeText when typing', () => {
    const onChangeText = vi.fn();
    render(
      <InlineAddInput
        value=""
        onChangeText={onChangeText}
        onSubmit={vi.fn()}
        placeholder="Add item..."
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Add item...'), {
      target: { value: 'Salt' },
    });
    expect(onChangeText).toHaveBeenCalledWith('Salt');
  });

  it('calls onSubmit when submit button is pressed with content', () => {
    const onSubmit = vi.fn();
    render(
      <InlineAddInput
        value="Salt"
        onChangeText={vi.fn()}
        onSubmit={onSubmit}
        placeholder="Add item..."
      />,
    );
    fireEvent.click(screen.getByTestId('inline-add-button'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('renders with custom placeholder color', () => {
    render(
      <InlineAddInput
        value=""
        onChangeText={vi.fn()}
        onSubmit={vi.fn()}
        placeholder="Add item..."
        placeholderTextColor="#999"
      />,
    );
    expect(screen.getByPlaceholderText('Add item...')).toBeDefined();
  });
});
