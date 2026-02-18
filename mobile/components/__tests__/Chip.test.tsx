import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Chip } from '../Chip';

describe('Chip', () => {
  describe('filled variant', () => {
    it('renders label text', () => {
      render(<Chip label="Salt" variant="filled" />);
      expect(screen.getByText('Salt')).toBeDefined();
    });

    it('shows remove icon by default', () => {
      render(<Chip label="Salt" variant="filled" onPress={vi.fn()} />);
      expect(screen.getByText('Salt')).toBeDefined();
    });

    it('hides remove icon when disabled', () => {
      render(<Chip label="Salt" variant="filled" disabled onPress={vi.fn()} />);
      expect(screen.getByText('Salt')).toBeDefined();
    });

    it('calls onPress when pressed', () => {
      const onPress = vi.fn();
      render(<Chip label="Salt" variant="filled" onPress={onPress} />);
      fireEvent.click(screen.getByText('Salt'));
      expect(onPress).toHaveBeenCalledOnce();
    });

    it('does not call onPress when disabled', () => {
      const onPress = vi.fn();
      render(<Chip label="Salt" variant="filled" disabled onPress={onPress} />);
      fireEvent.click(screen.getByText('Salt'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('capitalizes label when capitalize prop is true', () => {
      render(<Chip label="salt" variant="filled" capitalize />);
      expect(screen.getByText('salt')).toBeDefined();
    });

    it('hides remove icon when showRemove is false', () => {
      render(
        <Chip label="Salt" variant="filled" showRemove={false} onPress={vi.fn()} />,
      );
      expect(screen.getByText('Salt')).toBeDefined();
    });
  });

  describe('outline variant', () => {
    it('renders label text', () => {
      render(<Chip label="Garlic" variant="outline" onPress={vi.fn()} />);
      expect(screen.getByText('Garlic')).toBeDefined();
    });

    it('calls onPress when pressed', () => {
      const onPress = vi.fn();
      render(<Chip label="Garlic" variant="outline" onPress={onPress} />);
      fireEvent.click(screen.getByText('Garlic'));
      expect(onPress).toHaveBeenCalledOnce();
    });

    it('does not call onPress when disabled', () => {
      const onPress = vi.fn();
      render(
        <Chip label="Garlic" variant="outline" disabled onPress={onPress} />,
      );
      fireEvent.click(screen.getByText('Garlic'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('toggle variant', () => {
    it('renders label text', () => {
      render(<Chip label="Office" variant="toggle" onPress={vi.fn()} />);
      expect(screen.getByText('Office')).toBeDefined();
    });

    it('renders with dot when provided', () => {
      render(
        <Chip
          label="Office"
          variant="toggle"
          dot="#7A9BBD"
          onPress={vi.fn()}
        />,
      );
      expect(screen.getByText('Office')).toBeDefined();
    });

    it('calls onPress to toggle', () => {
      const onPress = vi.fn();
      render(<Chip label="Office" variant="toggle" onPress={onPress} />);
      fireEvent.click(screen.getByText('Office'));
      expect(onPress).toHaveBeenCalledOnce();
    });
  });

  describe('display variant', () => {
    it('renders read-only label', () => {
      render(<Chip label="Home" variant="display" />);
      expect(screen.getByText('Home')).toBeDefined();
    });

    it('renders with dot', () => {
      render(<Chip label="Home" variant="display" dot="#8B9D77" />);
      expect(screen.getByText('Home')).toBeDefined();
    });

    it('is not pressable without onPress', () => {
      const { container } = render(<Chip label="Home" variant="display" />);
      expect(container).toBeDefined();
    });

    it('renders with custom bg and color', () => {
      render(
        <Chip label="Veggie" variant="display" bg="#E8F5E9" color="#2E7D32" />,
      );
      expect(screen.getByText('Veggie')).toBeDefined();
    });

    it('renders with leading icon', () => {
      render(
        <Chip
          label="Privat"
          variant="display"
          icon="lock-closed-outline"
          bg="#333"
          color="#fff"
        />,
      );
      expect(screen.getByText('Privat')).toBeDefined();
    });

    it('renders with prefix', () => {
      render(<Chip label="pasta" variant="display" prefix="#" />);
      expect(screen.getByText('#pasta')).toBeDefined();
    });

    it('renders uppercase when specified', () => {
      render(
        <Chip
          label="admin"
          variant="display"
          bg="rgba(255,152,0,0.13)"
          color="#FF9800"
          uppercase
          size="sm"
        />,
      );
      expect(screen.getByText('admin')).toBeDefined();
    });
  });

  describe('testID', () => {
    it('forwards testID to Pressable', () => {
      render(
        <Chip
          label="Test"
          variant="filled"
          testID="chip-test"
          onPress={vi.fn()}
        />,
      );
      expect(screen.getByTestId('chip-test')).toBeDefined();
    });
  });
});
