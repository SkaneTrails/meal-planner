/**
 * Ingredient parser for scaling quantities based on servings.
 * Simple client-side implementation for fast grocery list generation.
 */

interface ParsedIngredient {
  quantity: number | null;
  unit: string | null;
  name: string;
  original: string;
}

// Unicode fraction mappings
const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

// Common units (metric, imperial, Swedish)
const UNITS = new Set([
  // Volume - metric
  'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters', 'dl', 'deciliter', 'deciliters', 'cl',
  // Volume - imperial
  'tsp', 'teaspoon', 'teaspoons', 'tbsp', 'tablespoon', 'tablespoons', 'cup', 'cups', 'fl oz',
  // Weight - metric
  'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms', 'mg',
  // Weight - imperial
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
  // Count/pieces
  'piece', 'pieces', 'slice', 'slices', 'clove', 'cloves', 'head', 'heads', 'bunch', 'bunches',
  'sprig', 'sprigs', 'stalk', 'stalks', 'can', 'cans', 'jar', 'jars', 'package', 'packages',
  // Size descriptors
  'small', 'medium', 'large', 'handful', 'handfuls', 'pinch', 'pinches',
  // Swedish units
  'msk', 'tsk', 'krm', 'st', 'port', 'portioner',
]);

/**
 * Parse a fraction string to a number.
 */
function parseFraction(text: string): number | null {
  let normalized = text.trim();
  if (!normalized) return null;

  // Replace unicode fractions
  for (const [unicode, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    normalized = normalized.replace(unicode, ` ${ascii}`);
  }
  normalized = normalized.trim();

  // Try direct float parse
  const direct = parseFloat(normalized);
  if (!isNaN(direct) && !normalized.includes('/')) {
    return direct;
  }

  // Try simple fraction like "1/2"
  if (normalized.includes('/') && !normalized.includes(' ')) {
    const [num, denom] = normalized.split('/').map(Number);
    if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
      return num / denom;
    }
  }

  // Try mixed number like "1 1/2"
  const mixedMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const denom = parseInt(mixedMatch[3], 10);
    if (denom !== 0) {
      return whole + num / denom;
    }
  }

  return null;
}

/**
 * Format a quantity as a clean string.
 */
export function formatQuantity(qty: number): string {
  if (qty === Math.floor(qty)) {
    return String(Math.floor(qty));
  }

  const fractionMap: Record<number, string> = {
    0.25: '¼',
    0.33: '⅓',
    0.5: '½',
    0.67: '⅔',
    0.75: '¾',
  };

  const whole = Math.floor(qty);
  const frac = qty - whole;
  const fracRounded = Math.round(frac * 100) / 100;

  if (fractionMap[fracRounded]) {
    return whole > 0 ? `${whole} ${fractionMap[fracRounded]}` : fractionMap[fracRounded];
  }

  // Round to 1 decimal
  return qty.toFixed(1).replace(/\.0$/, '');
}

/**
 * Parse an ingredient string into structured components.
 */
export function parseIngredient(text: string): ParsedIngredient {
  const original = text;
  let remaining = text.trim();

  if (!remaining) {
    return { quantity: null, unit: null, name: '', original };
  }

  // Try to match quantity at start (including unicode fractions)
  const unicodePattern = /^(\d*\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;
  const numberPattern = /^((?:\d+\s+)?(?:\d+\/\d+|\d*\.?\d+))/;

  let quantity: number | null = null;

  let match = remaining.match(unicodePattern);
  if (match) {
    quantity = parseFraction(match[1]);
    remaining = remaining.slice(match[0].length).trim();
  } else {
    match = remaining.match(numberPattern);
    if (match) {
      quantity = parseFraction(match[1]);
      remaining = remaining.slice(match[0].length).trim();
    }
  }

  // Try to match unit
  let unit: string | null = null;
  if (remaining) {
    const words = remaining.split(/\s+/);
    const firstWord = words[0]?.toLowerCase().replace(/[.,]$/, '');
    if (UNITS.has(firstWord)) {
      unit = words[0].replace(/[.,]$/, '');
      remaining = words.slice(1).join(' ');
    }
  }

  // Name is the rest
  let name = remaining.trim();
  if (name.toLowerCase().startsWith('of ')) {
    name = name.slice(3);
  }

  return { quantity, unit, name, original };
}

/**
 * Scale an ingredient by a multiplier and return the formatted string.
 */
export function scaleIngredient(ingredient: string, multiplier: number): string {
  if (multiplier === 1) return ingredient;

  const parsed = parseIngredient(ingredient);

  if (parsed.quantity === null) {
    return ingredient; // Can't scale without a quantity
  }

  const scaledQty = parsed.quantity * multiplier;
  const qtyStr = formatQuantity(scaledQty);

  if (parsed.unit) {
    return `${qtyStr} ${parsed.unit} ${parsed.name}`.trim();
  }
  return `${qtyStr} ${parsed.name}`.trim();
}

/**
 * Get a normalized name for ingredient grouping.
 */
export function normalizeIngredientName(ingredient: string): string {
  const parsed = parseIngredient(ingredient);
  return parsed.name.toLowerCase().trim();
}
