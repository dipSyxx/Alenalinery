export const WEEK_STARTS_ON = 1;

export const WEEKDAY_ORDER_MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0] as const;

export const WEEKDAY_SHORT_LABELS_MONDAY_FIRST = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"] as const;

export const WEEKDAY_NAMES_BY_INDEX = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота"] as const;

const weekdayRank = new Map<number, number>(WEEKDAY_ORDER_MONDAY_FIRST.map((weekday, index) => [weekday, index]));

export function compareWeekdayMondayFirst(a: number, b: number): number {
  return (weekdayRank.get(a) ?? a) - (weekdayRank.get(b) ?? b);
}
