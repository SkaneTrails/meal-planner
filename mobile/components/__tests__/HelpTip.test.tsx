import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { HelpTip, HelpTipIcon } from '../HelpTip';

describe('HelpTipIcon', () => {
  it('renders the info icon toggle', () => {
    render(<HelpTipIcon helpText="Some help" />);
    expect(screen.getByTestId('help-tip-toggle')).toBeDefined();
  });

  it('does not show help text by default', () => {
    render(<HelpTipIcon helpText="Hidden info" />);
    expect(screen.queryByText('Hidden info')).toBeNull();
  });

  it('shows help text after pressing the icon', () => {
    render(<HelpTipIcon helpText="Visible info" />);
    fireEvent.click(screen.getByTestId('help-tip-toggle'));
    expect(screen.getByText('Visible info')).toBeDefined();
  });
});

describe('HelpTip', () => {
  it('renders children', () => {
    render(
      <HelpTip helpText="Extra info">
        <Text>Label</Text>
      </HelpTip>,
    );
    expect(screen.getByText('Label')).toBeDefined();
  });

  it('does not show help text by default', () => {
    render(
      <HelpTip helpText="Extra info">
        <Text>Label</Text>
      </HelpTip>,
    );
    expect(screen.queryByText('Extra info')).toBeNull();
  });

  it('shows help text in a popup after pressing the info icon', () => {
    render(
      <HelpTip helpText="Detailed explanation">
        <Text>Title</Text>
      </HelpTip>,
    );
    fireEvent.click(screen.getByTestId('help-tip-toggle'));
    expect(screen.getByText('Detailed explanation')).toBeDefined();
  });

  it('renders the backdrop as pressable when open', () => {
    render(
      <HelpTip helpText="Detailed explanation">
        <Text>Title</Text>
      </HelpTip>,
    );
    fireEvent.click(screen.getByTestId('help-tip-toggle'));

    const backdrop = screen.getByTestId('help-tip-backdrop');
    expect(backdrop).toBeDefined();
    expect(backdrop.tagName).toBe('BUTTON');
  });
});
