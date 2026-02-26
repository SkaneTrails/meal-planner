import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SectionLabel } from '../SectionLabel';

describe('SectionLabel', () => {
  it('renders text', () => {
    render(<SectionLabel text="Category" />);
    expect(screen.getByText('Category')).toBeDefined();
  });

  it('renders help-tip toggle when tooltip is set', () => {
    render(<SectionLabel text="Diet Type" tooltip="AI adapts recipes" />);
    expect(screen.getByTestId('help-tip-toggle')).toBeDefined();
  });

  it('does not render help-tip toggle when tooltip is omitted', () => {
    render(<SectionLabel text="Diet Type" />);
    expect(screen.queryByTestId('help-tip-toggle')).toBeNull();
  });

  it('shows popup text when tooltip icon is pressed', () => {
    render(<SectionLabel text="Diet Type" tooltip="Choose your diet" />);
    fireEvent.click(screen.getByTestId('help-tip-toggle'));
    expect(screen.getByText('Choose your diet')).toBeDefined();
  });
});
