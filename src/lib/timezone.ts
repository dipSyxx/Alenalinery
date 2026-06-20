import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { uk } from "date-fns/locale";

export const BUSINESS_TIME_ZONE = "Europe/Kyiv";

export function getZonedDateTime(date: string, time: string, timeZone = BUSINESS_TIME_ZONE): Date {
  return fromZonedTime(`${date}T${time}:00`, timeZone);
}

export function getWeekdayInTimeZone(date: Date, timeZone = BUSINESS_TIME_ZONE): number {
  return toZonedTime(date, timeZone).getDay();
}

export function formatKyivDateTime(date: Date): string {
  return formatInTimeZone(date, BUSINESS_TIME_ZONE, "EEEE, d MMMM yyyy 'о' HH:mm", {
    locale: uk,
  });
}
