import { format } from "date-fns";

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string | null | undefined): value is string {
  return typeof value === "string" && DATE_KEY_PATTERN.test(value);
}

export function dateToKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function dateKeyToDate(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00`);
}

export function formatDateKey(dateKey: string, pattern: string, options?: Parameters<typeof format>[2]): string {
  return format(dateKeyToDate(dateKey), pattern, options);
}
