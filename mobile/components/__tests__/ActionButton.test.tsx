import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActionButton } from '../ActionButton';

const noop = () => {};

describe('ActionButton', () => {
  describe('Delete', () => {
    it('renders with trash icon and warning tone', () => {
      render(<ActionButton.Delete onPress={noop} label="Remove" />);
      expect(screen.getByText('Remove')).toBeTruthy();
    });

    it('renders icon-only without label', () => {
      render(<ActionButton.Delete onPress={noop} testID="del" />);
      expect(screen.getByTestId('del')).toBeTruthy();
    });
  });

  describe('Dismiss', () => {
    it('renders close icon button', () => {
      render(<ActionButton.Dismiss onPress={noop} testID="dismiss" />);
      expect(screen.getByTestId('dismiss')).toBeTruthy();
    });
  });

  describe('ClearInput', () => {
    it('renders close-circle icon button', () => {
      render(<ActionButton.ClearInput onPress={noop} testID="clear" />);
      expect(screen.getByTestId('clear')).toBeTruthy();
    });
  });

  describe('Cancel', () => {
    it('renders label-only cancel button', () => {
      render(<ActionButton.Cancel onPress={noop} label="Cancel" />);
      expect(screen.getByText('Cancel')).toBeTruthy();
    });
  });

  describe('SignOut', () => {
    it('renders sign-out button with label', () => {
      render(<ActionButton.SignOut onPress={noop} label="Sign Out" />);
      expect(screen.getByText('Sign Out')).toBeTruthy();
    });
  });

  describe('Add', () => {
    it('renders add icon button', () => {
      render(<ActionButton.Add onPress={noop} testID="add" />);
      expect(screen.getByTestId('add')).toBeTruthy();
    });
  });

  describe('Back', () => {
    it('renders labeled back button', () => {
      render(<ActionButton.Back onPress={noop} label="Back" />);
      expect(screen.getByText('Back')).toBeTruthy();
    });

    it('renders icon-only back button (no label)', () => {
      render(<ActionButton.Back onPress={noop} testID="back-icon" />);
      expect(screen.getByTestId('back-icon')).toBeTruthy();
    });

    it('accepts tone override for glass contexts', () => {
      render(<ActionButton.Back onPress={noop} tone="glass" testID="back-glass" />);
      expect(screen.getByTestId('back-glass')).toBeTruthy();
    });
  });

  describe('Forward', () => {
    it('renders labeled forward button', () => {
      render(<ActionButton.Forward onPress={noop} label="Next" />);
      expect(screen.getByText('Next')).toBeTruthy();
    });

    it('renders icon-only forward button (no label)', () => {
      render(<ActionButton.Forward onPress={noop} testID="fwd-icon" />);
      expect(screen.getByTestId('fwd-icon')).toBeTruthy();
    });
  });
});
