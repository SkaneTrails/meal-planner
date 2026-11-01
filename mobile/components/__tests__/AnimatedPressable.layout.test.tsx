/**
 * Layout regression: flex/margin props must land on the outer Pressable even
 * when `style` is a function. On native (Yoga), `flex: 1` on the inner view of
 * an auto-height wrapper collapses it to its padding — clipped button labels.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const captured = vi.hoisted(() => ({
  outer: [] as unknown[],
  inner: [] as unknown[],
}));

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>();
  const flatten = (s: unknown) => actual.StyleSheet.flatten(s as never);
  const Pressable = ({ children, style }: { children: unknown; style: unknown }) => {
    captured.outer.push(flatten(style));
    const content =
      typeof children === 'function' ? children({ pressed: false }) : children;
    return React.createElement('div', null, content);
  };
  const AnimatedView = ({ children, style }: { children: React.ReactNode; style: unknown }) => {
    captured.inner.push(flatten(style));
    return React.createElement('div', null, children);
  };
  return {
    ...actual,
    Pressable,
    Animated: { ...actual.Animated, View: AnimatedView },
  };
});

import { AnimatedPressable } from '../AnimatedPressable';

const last = (list: unknown[]) => list[list.length - 1] as Record<string, unknown>;

describe('AnimatedPressable layout', () => {
  beforeEach(() => {
    captured.outer.length = 0;
    captured.inner.length = 0;
  });

  it('moves flex and margin from a function style to the outer Pressable', () => {
    render(
      <AnimatedPressable
        style={() => [{ paddingVertical: 12 }, { flex: 1, marginTop: 4 }]}
      >
        <span>Btn</span>
      </AnimatedPressable>,
    );

    expect(last(captured.outer)).toMatchObject({ flex: 1, marginTop: 4 });
    expect(last(captured.inner).flex).toBeUndefined();
    expect(last(captured.inner).marginTop).toBeUndefined();
    expect(last(captured.inner)).toMatchObject({ paddingVertical: 12, flexGrow: 1 });
  });

  it('does not grow the inner view when the wrapper is not flexed', () => {
    render(
      <AnimatedPressable style={() => ({ paddingVertical: 12 })}>
        <span>Btn</span>
      </AnimatedPressable>,
    );

    expect(last(captured.inner).flexGrow).toBeUndefined();
  });

  it('handles object styles the same way', () => {
    render(
      <AnimatedPressable style={{ flex: 1, padding: 8 }}>
        <span>Btn</span>
      </AnimatedPressable>,
    );

    expect(last(captured.outer)).toMatchObject({ flex: 1 });
    expect(last(captured.inner)).toMatchObject({ padding: 8, flexGrow: 1 });
  });
});
