/**
 * Date helpers for the demo dataset.
 *
 * The demo runs against a FIXED "as of" date instead of the real clock. That
 * keeps server/client renders identical (no hydration mismatches), keeps the
 * sample data internally consistent (overdue means overdue, always), and
 * satisfies Next.js Cache Components, which disallow reading the current time
 * during render.
 *
 * All dates are plain ISO strings (YYYY-MM-DD) and all math is done in UTC.
 */

export type ISODate = string;

/** The simulated "today" for the whole demo. */
export const DEMO_TODAY: ISODate = "2026-10-13";

const DAY_MS = 86_400_000;

export function toMs(date: ISODate): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromMs(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromMs(toMs(date) + days * DAY_MS);
}

/** Whole days from b to a (a - b). Positive when a is later than b. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toMs(a) - toMs(b)) / DAY_MS);
}

export function monthKey(date: ISODate): string {
  return date.slice(0, 7);
}

/** Returns the month key `offset` months away from the given month key. */
export function shiftMonth(key: string, offset: number): string {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + offset;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function daysInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const monthLong = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(date: ISODate): string {
  return longDate.format(toMs(date));
}

export function formatShortDate(date: ISODate): string {
  return shortDate.format(toMs(date));
}

export function formatMonthShort(key: string): string {
  return monthShort.format(toMs(`${key}-01`));
}

export function formatMonthLong(key: string): string {
  return monthLong.format(toMs(`${key}-01`));
}

/** "ISO datetime" helper for activity timestamps: 2026-10-13T14:32 */
export function formatTime(at: string): string {
  const time = at.slice(11, 16);
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Human-friendly relative label against the demo "today". */
export function relativeDay(date: ISODate, today: ISODate = DEMO_TODAY): string {
  const diff = diffDays(date, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 14) return `In ${diff} days`;
  if (diff < -1 && diff > -14) return `${Math.abs(diff)} days ago`;
  return formatShortDate(date);
}

/** Relative label for activity timestamps (date + time). */
export function relativeActivity(at: string, today: ISODate = DEMO_TODAY): string {
  const day = at.slice(0, 10);
  const diff = diffDays(today, day);
  if (diff === 0) return `Today · ${formatTime(at)}`;
  if (diff === 1) return `Yesterday · ${formatTime(at)}`;
  return `${formatShortDate(day)} · ${formatTime(at)}`;
}
