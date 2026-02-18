import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { SettingToggleRow } from '../SettingToggleRow';

describe('SettingToggleRow', () => {
  it('renders label and subtitle', () => {
    render(
      <SettingToggleRow
        label="Test Label"
        subtitle="Test description"
        value={false}
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByText('Test Label')).toBeDefined();
    expect(screen.getByText('Test description')).toBeDefined();
  });

  it('renders without subtitle', () => {
    render(
      <SettingToggleRow
        label="Toggle"
        value={true}
        onValueChange={() => {}}
      />,
    );
    expect(screen.getByText('Toggle')).toBeDefined();
  });

  it('calls onValueChange when toggle is clicked', () => {
    const handler = vi.fn();
    render(
      <SettingToggleRow
        label="Toggle"
        value={false}
        onValueChange={handler}
      />,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(handler).toHaveBeenCalledWith(true);
  });
});
