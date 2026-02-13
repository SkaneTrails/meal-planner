/**
 * Shared date formatting and week calculation utilities.
 *
 * Week start is a household setting (monday or saturday).
 * All screens read it from SettingsContext via `useSettings().weekStart`.
 */

export type WeekStart = 'monday' | 'saturday';

/**
 * Format a Date as "YYYY-MM-DD" using local timezone (no UTC shift).
 */
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Return the 7 dates of the week containing `today`, offset by `weekOffset` weeks.
 */
export const getWeekDatesArray = (
  weekOffset = 0,
  weekStart: WeekStart = 'monday',
): Date[] => {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sun … 6=Sat

  const daysSinceStart =
    weekStart === 'monday'
      ? (currentDay + 6) % 7 // Mon=0 … Sun=6
      : (currentDay + 1) % 7; // Sat=0 … Fri=6

  const firstDay = new Date(today);
  firstDay.setDate(today.getDate() - daysSinceStart + weekOffset * 7);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(firstDay);
    d.setDate(firstDay.getDate() + i);
    return d;
  });
};

/**
 * Return `{ start, end }` formatted as "YYYY-MM-DD" for the current week.
 */
export const getWeekDateRange = (
  weekStart: WeekStart = 'monday',
): { start: string; end: string } => {
  const dates = getWeekDatesArray(0, weekStart);
  return {
    start: formatDateLocal(dates[0]),
    end: formatDateLocal(dates[6]),
  };
};

/** BCP-47 locale mapping for Intl date formatting. */
export const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  sv: 'sv-SE',
  it: 'it-IT',
};

/** Resolve a settings language code to a BCP-47 locale string. */
export const toBcp47 = (language: string): string =>
  LOCALE_MAP[language] || 'en-US';

/**
 * Format a week range for display, e.g. "Mon, Jan 6 - Sun, Jan 12".
 */
export const formatWeekRange = (dates: Date[], locale: string): string => {
  const bcp47 = toBcp47(locale);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return `${dates[0].toLocaleDateString(bcp47, opts)} - ${dates[6].toLocaleDateString(bcp47, opts)}`;
};

/**
 * Format a day header, e.g. "Monday · Jan 6" or "Today · Jan 6".
 */
export const formatDayHeader = (
  date: Date,
  locale: string,
  todayLabel: string,
): string => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const bcp47 = toBcp47(locale);
  const dayName = date.toLocaleDateString(bcp47, { weekday: 'long' });
  const monthDay = date.toLocaleDateString(bcp47, { month: 'short', day: 'numeric' });
  return isToday ? `${todayLabel} · ${monthDay}` : `${dayName} · ${monthDay}`;
};

/**
 * Check whether a date is before today (midnight comparison).
 */
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(date);
  check.setHours(0, 0, 0, 0);
  return check < today;
};
