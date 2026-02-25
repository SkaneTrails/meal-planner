import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePortionScaling } from '../usePortionScaling';

describe('usePortionScaling', () => {
  it('initializes with recipe servings', () => {
    const { result } = renderHook(() => usePortionScaling(4));
    expect(result.current.currentPortions).toBe(4);
    expect(result.current.originalPortions).toBe(4);
    expect(result.current.scaleFactor).toBe(1);
    expect(result.current.isScaled).toBe(false);
  });

  it('treats null servings as 0 portions', () => {
    const { result } = renderHook(() => usePortionScaling(null));
    expect(result.current.originalPortions).toBe(0);
    expect(result.current.currentPortions).toBe(0);
    expect(result.current.scaleFactor).toBe(1);
  });

  it('treats undefined servings as 0 portions', () => {
    const { result } = renderHook(() => usePortionScaling(undefined));
    expect(result.current.originalPortions).toBe(0);
    expect(result.current.currentPortions).toBe(0);
  });

  it('treats zero servings as 0 portions', () => {
    const { result } = renderHook(() => usePortionScaling(0));
    expect(result.current.originalPortions).toBe(0);
    expect(result.current.currentPortions).toBe(0);
  });

  it('increments portion count', () => {
    const { result } = renderHook(() => usePortionScaling(4));
    act(() => result.current.increment());
    expect(result.current.currentPortions).toBe(5);
    expect(result.current.scaleFactor).toBeCloseTo(1.25);
    expect(result.current.isScaled).toBe(true);
  });

  it('decrements portion count', () => {
    const { result } = renderHook(() => usePortionScaling(4));
    act(() => result.current.decrement());
    expect(result.current.currentPortions).toBe(3);
    expect(result.current.scaleFactor).toBeCloseTo(0.75);
    expect(result.current.isScaled).toBe(true);
  });

  it('does not decrement below 1', () => {
    const { result } = renderHook(() => usePortionScaling(1));
    act(() => result.current.decrement());
    expect(result.current.currentPortions).toBe(1);
  });

  it('does not increment above 50', () => {
    const { result } = renderHook(() => usePortionScaling(50));
    act(() => result.current.increment());
    expect(result.current.currentPortions).toBe(50);
  });

  it('resets to original portions', () => {
    const { result } = renderHook(() => usePortionScaling(4));
    act(() => result.current.increment());
    act(() => result.current.increment());
    expect(result.current.currentPortions).toBe(6);

    act(() => result.current.reset());
    expect(result.current.currentPortions).toBe(4);
    expect(result.current.isScaled).toBe(false);
    expect(result.current.scaleFactor).toBe(1);
  });

  it('scales ingredients by multiplier', () => {
    const { result } = renderHook(() => usePortionScaling(2));
    act(() => result.current.increment());
    act(() => result.current.increment());

    const scaled = result.current.scaleIngredients([
      '100 g flour',
      '2 eggs',
      'salt to taste',
    ]);

    expect(scaled[0]).toBe('200 g flour');
    expect(scaled[1]).toBe('4 eggs');
    expect(scaled[2]).toBe('salt to taste');
  });

  it('returns original ingredients when not scaled', () => {
    const { result } = renderHook(() => usePortionScaling(4));
    const ingredients = ['100 g flour', '2 eggs'];
    const scaled = result.current.scaleIngredients(ingredients);
    expect(scaled).toBe(ingredients);
  });

  it('handles fractional scaling', () => {
    const { result } = renderHook(() => usePortionScaling(4));
    act(() => result.current.decrement());

    const scaled = result.current.scaleIngredients(['4 cups rice']);
    expect(scaled[0]).toBe('3 cups rice');
  });
});
