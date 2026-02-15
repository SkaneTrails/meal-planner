// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  formatQuantity,
  parseIngredient,
  scaleIngredient,
  normalizeIngredientName,
} from '../ingredientParser';

describe('formatQuantity', () => {
  it('returns whole number for integer', () => {
    expect(formatQuantity(3)).toBe('3');
  });

  it('returns unicode fraction for 0.5', () => {
    expect(formatQuantity(0.5)).toBe('½');
  });

  it('returns unicode fraction for 0.25', () => {
    expect(formatQuantity(0.25)).toBe('¼');
  });

  it('returns unicode fraction for 0.75', () => {
    expect(formatQuantity(0.75)).toBe('¾');
  });

  it('returns mixed number for 1.5', () => {
    expect(formatQuantity(1.5)).toBe('1 ½');
  });

  it('returns mixed number for 2.25', () => {
    expect(formatQuantity(2.25)).toBe('2 ¼');
  });

  it('rounds to 1 decimal for non-fraction', () => {
    expect(formatQuantity(1.3)).toBe('1.3');
  });

  it('returns 1/3 fraction approximation', () => {
    expect(formatQuantity(0.33)).toBe('⅓');
  });

  it('returns 2/3 fraction approximation', () => {
    expect(formatQuantity(0.67)).toBe('⅔');
  });

  it('returns mixed whole + 2/3', () => {
    expect(formatQuantity(2.67)).toBe('2 ⅔');
  });

  it('handles zero', () => {
    expect(formatQuantity(0)).toBe('0');
  });
});

describe('parseIngredient', () => {
  it('parses simple quantity + name', () => {
    const result = parseIngredient('2 tomater');
    expect(result.quantity).toBe(2);
    expect(result.unit).toBeNull();
    expect(result.name).toBe('tomater');
  });

  it('parses quantity + unit + name', () => {
    const result = parseIngredient('200 g kycklingfilé');
    expect(result.quantity).toBe(200);
    expect(result.unit).toBe('g');
    expect(result.name).toBe('kycklingfilé');
  });

  it('parses quantity with dl unit', () => {
    const result = parseIngredient('2 dl grädde');
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('dl');
    expect(result.name).toBe('grädde');
  });

  it('parses unicode fraction', () => {
    const result = parseIngredient('½ citron');
    expect(result.quantity).toBe(0.5);
    expect(result.name).toBe('citron');
  });

  it('parses mixed number with unicode fraction', () => {
    const result = parseIngredient('1½ dl mjölk');
    expect(result.quantity).toBe(1.5);
    expect(result.unit).toBe('dl');
    expect(result.name).toBe('mjölk');
  });

  it('parses fraction like 1/2', () => {
    const result = parseIngredient('1/2 tsk salt');
    expect(result.quantity).toBe(0.5);
    expect(result.unit).toBe('tsk');
    expect(result.name).toBe('salt');
  });

  it('parses mixed number like 1 1/2', () => {
    const result = parseIngredient('1 1/2 msk olivolja');
    expect(result.quantity).toBe(1.5);
    expect(result.unit).toBe('msk');
    expect(result.name).toBe('olivolja');
  });

  it('parses decimal quantity', () => {
    const result = parseIngredient('0.5 kg potatis');
    expect(result.quantity).toBe(0.5);
    expect(result.unit).toBe('kg');
    expect(result.name).toBe('potatis');
  });

  it('returns null quantity for text-only ingredient', () => {
    const result = parseIngredient('salt och peppar');
    expect(result.quantity).toBeNull();
    expect(result.unit).toBeNull();
    expect(result.name).toBe('salt och peppar');
  });

  it('handles empty string', () => {
    const result = parseIngredient('');
    expect(result.quantity).toBeNull();
    expect(result.unit).toBeNull();
    expect(result.name).toBe('');
  });

  it('strips "of" prefix from name', () => {
    const result = parseIngredient('2 cups of flour');
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('cups');
    expect(result.name).toBe('flour');
  });

  it('preserves original text', () => {
    const result = parseIngredient('3 msk smör');
    expect(result.original).toBe('3 msk smör');
  });

  it('handles Swedish units msk and tsk', () => {
    const msk = parseIngredient('2 msk socker');
    expect(msk.unit).toBe('msk');
    expect(msk.name).toBe('socker');

    const tsk = parseIngredient('1 tsk kanel');
    expect(tsk.unit).toBe('tsk');
    expect(tsk.name).toBe('kanel');
  });

  it('handles krm unit', () => {
    const result = parseIngredient('2 krm peppar');
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('krm');
    expect(result.name).toBe('peppar');
  });

  it('handles st unit for pieces', () => {
    const result = parseIngredient('4 st ägg');
    expect(result.quantity).toBe(4);
    expect(result.unit).toBe('st');
    expect(result.name).toBe('ägg');
  });

  it('strips trailing period from unit', () => {
    const result = parseIngredient('2 dl. vatten');
    expect(result.unit).toBe('dl');
    expect(result.name).toBe('vatten');
  });
});

describe('scaleIngredient', () => {
  it('returns original when multiplier is 1', () => {
    expect(scaleIngredient('200 g kyckling', 1)).toBe('200 g kyckling');
  });

  it('doubles quantity', () => {
    expect(scaleIngredient('200 g kyckling', 2)).toBe('400 g kyckling');
  });

  it('halves quantity', () => {
    expect(scaleIngredient('200 g kyckling', 0.5)).toBe('100 g kyckling');
  });

  it('returns original for unscalable ingredient', () => {
    expect(scaleIngredient('salt och peppar', 2)).toBe('salt och peppar');
  });

  it('formats scaled fraction as unicode', () => {
    expect(scaleIngredient('1 dl grädde', 0.5)).toBe('½ dl grädde');
  });

  it('scales without unit', () => {
    expect(scaleIngredient('2 tomater', 3)).toBe('6 tomater');
  });
});

describe('normalizeIngredientName', () => {
  it('returns lowercase name without quantity or unit', () => {
    expect(normalizeIngredientName('200 g Kycklingfilé')).toBe('kycklingfilé');
  });

  it('normalizes different quantities to same name', () => {
    const a = normalizeIngredientName('2 dl grädde');
    const b = normalizeIngredientName('1 dl grädde');
    expect(a).toBe(b);
  });

  it('handles plain text ingredient', () => {
    expect(normalizeIngredientName('salt')).toBe('salt');
  });
});
