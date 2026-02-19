// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDateLocal,
  getWeekDatesArray,
  getWeekDateRange,
  formatWeekRange,
  formatDayHeader,
  isPastDate,
  toBcp47,
} from '../dateFormatter';

describe('formatDateLocal', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDateLocal(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  it('pads single-digit month and day', () => {
    expect(formatDateLocal(new Date(2025, 2, 3))).toBe('2025-03-03');
  });

  it('handles December correctly', () => {
    expect(formatDateLocal(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});

describe('getWeekDatesArray', () => {
  beforeEach(() => {
    // Wednesday Jan 15, 2025
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 7 dates', () => {
    expect(getWeekDatesArray()).toHaveLength(7);
  });

  it('starts on Monday by default', () => {
    const dates = getWeekDatesArray();
    expect(dates[0].getDay()).toBe(1); // Monday
    expect(formatDateLocal(dates[0])).toBe('2025-01-13');
  });

  it('ends on Sunday for monday-start', () => {
    const dates = getWeekDatesArray();
    expect(dates[6].getDay()).toBe(0); // Sunday
    expect(formatDateLocal(dates[6])).toBe('2025-01-19');
  });

  it('starts on Saturday when weekStart is saturday', () => {
    const dates = getWeekDatesArray(0, 'saturday');
    expect(dates[0].getDay()).toBe(6); // Saturday
    expect(formatDateLocal(dates[0])).toBe('2025-01-11');
  });

  it('ends on Friday for saturday-start', () => {
    const dates = getWeekDatesArray(0, 'saturday');
    expect(dates[6].getDay()).toBe(5); // Friday
    expect(formatDateLocal(dates[6])).toBe('2025-01-17');
  });

  it.each([
    // Fake date: Wed Jan 15, 2025 (getDay()=3)
    { start: 'sunday', expectedDay: 0, expectedDate: '2025-01-12' },
    { start: 'tuesday', expectedDay: 2, expectedDate: '2025-01-14' },
    { start: 'wednesday', expectedDay: 3, expectedDate: '2025-01-15' },
    { start: 'thursday', expectedDay: 4, expectedDate: '2025-01-09' },
    { start: 'friday', expectedDay: 5, expectedDate: '2025-01-10' },
  ] as const)(
    'starts on $start (day $expectedDay) with correct date',
    ({ start, expectedDay, expectedDate }) => {
      const dates = getWeekDatesArray(0, start);
      expect(dates[0].getDay()).toBe(expectedDay);
      expect(formatDateLocal(dates[0])).toBe(expectedDate);
      expect(dates).toHaveLength(7);
      // Last day should be 6 days after start
      const lastDay = (expectedDay + 6) % 7;
      expect(dates[6].getDay()).toBe(lastDay);
    },
  );

  it('offsets forward by one week', () => {
    const dates = getWeekDatesArray(1);
    expect(formatDateLocal(dates[0])).toBe('2025-01-20');
  });

  it('offsets backward by one week', () => {
    const dates = getWeekDatesArray(-1);
    expect(formatDateLocal(dates[0])).toBe('2025-01-06');
  });
});

describe('getWeekDateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns start and end strings for monday-start', () => {
    expect(getWeekDateRange('monday')).toEqual({
      start: '2025-01-13',
      end: '2025-01-19',
    });
  });

  it('returns start and end strings for saturday-start', () => {
    expect(getWeekDateRange('saturday')).toEqual({
      start: '2025-01-11',
      end: '2025-01-17',
    });
  });
});

describe('toBcp47', () => {
  it('maps known languages', () => {
    expect(toBcp47('en')).toBe('en-US');
    expect(toBcp47('sv')).toBe('sv-SE');
    expect(toBcp47('it')).toBe('it-IT');
  });

  it('falls back to en-US for unknown languages', () => {
    expect(toBcp47('fr')).toBe('en-US');
  });
});

describe('formatWeekRange', () => {
  it('formats a week range with locale', () => {
    const dates = [
      new Date(2025, 0, 13), // Mon
      new Date(2025, 0, 14),
      new Date(2025, 0, 15),
      new Date(2025, 0, 16),
      new Date(2025, 0, 17),
      new Date(2025, 0, 18),
      new Date(2025, 0, 19), // Sun
    ];
    const result = formatWeekRange(dates, 'en');
    expect(result).toContain('Jan');
    expect(result).toContain('13');
    expect(result).toContain('19');
    expect(result).toContain(' - ');
  });
});

describe('formatDayHeader', () => {
  it('returns day name and date for non-today', () => {
    const date = new Date(2025, 0, 13);
    const result = formatDayHeader(date, 'en', 'Today');
    expect(result).toContain('Monday');
    expect(result).toContain('·');
  });

  it('uses today label when date is today', () => {
    const today = new Date();
    const result = formatDayHeader(today, 'en', 'Idag');
    expect(result).toMatch(/^Idag · /);
  });
});

describe('isPastDate', () => {
  it('returns true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isPastDate(yesterday)).toBe(true);
  });

  it('returns false for today', () => {
    expect(isPastDate(new Date())).toBe(false);
  });

  it('returns false for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPastDate(tomorrow)).toBe(false);
  });
});
