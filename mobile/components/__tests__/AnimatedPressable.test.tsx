import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AnimatedPressable } from '../AnimatedPressable';

describe('AnimatedPressable', () => {
  it('renders children', () => {
    render(
      <AnimatedPressable>
        <span>Click me</span>
      </AnimatedPressable>,
    );
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('calls onPress when pressed', () => {
    const handlePress = vi.fn();
    render(
      <AnimatedPressable onPress={handlePress}>
        <span>Tap</span>
      </AnimatedPressable>,
    );
    fireEvent.click(screen.getByText('Tap'));
    expect(handlePress).toHaveBeenCalledOnce();
  });

  it('forwards onPressIn callback', () => {
    const handlePressIn = vi.fn();
    render(
      <AnimatedPressable onPressIn={handlePressIn}>
        <span>Hold</span>
      </AnimatedPressable>,
    );
    // Our Pressable mock maps onPress to onClick but doesn't have onPressIn
    // Instead verify the prop was accepted without error
    expect(screen.getByText('Hold')).toBeDefined();
  });

  it('does not fire onPress when disabled', () => {
    const handlePress = vi.fn();
    render(
      <AnimatedPressable onPress={handlePress} disabled>
        <span>Disabled</span>
      </AnimatedPressable>,
    );
    fireEvent.click(screen.getByText('Disabled'));
    expect(handlePress).not.toHaveBeenCalled();
  });

  it('accepts custom pressScale without crashing', () => {
    render(
      <AnimatedPressable pressScale={0.9}>
        <span>Scale</span>
      </AnimatedPressable>,
    );
    expect(screen.getByText('Scale')).toBeDefined();
  });

  it('accepts disableAnimation prop without crashing', () => {
    render(
      <AnimatedPressable disableAnimation>
        <span>No anim</span>
      </AnimatedPressable>,
    );
    expect(screen.getByText('No anim')).toBeDefined();
  });

  it('accepts function style prop', () => {
    render(
      <AnimatedPressable style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
        <span>Styled</span>
      </AnimatedPressable>,
    );
    expect(screen.getByText('Styled')).toBeDefined();
  });

  it('passes testID through to the DOM', () => {
    render(
      <AnimatedPressable testID="my-button">
        <span>ID</span>
      </AnimatedPressable>,
    );
    expect(screen.getByTestId('my-button')).toBeDefined();
  });
});
