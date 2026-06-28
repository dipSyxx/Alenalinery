"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { uk } from "date-fns/locale";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateKeyToDate, dateToKey, formatDateKey, isDateKey } from "@/lib/date-key";

const WEEK_STARTS_ON = 1;
const WEEKDAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];

const monthVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 18 : -18,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -18 : 18,
  }),
};

type DateCalendarGridProps = {
  value?: string;
  onChange: (dateKey: string) => void;
  minDate?: string;
  maxDate?: string;
  initialMonth?: string;
  label?: string;
  className?: string;
  disabledDate?: (dateKey: string) => boolean;
};

export function DateCalendarGrid({
  value,
  onChange,
  minDate,
  maxDate,
  initialMonth,
  label = "Календар",
  className,
  disabledDate,
}: DateCalendarGridProps) {
  const shouldReduceMotion = useReducedMotion();
  const initialVisibleMonth = isDateKey(value)
    ? value
    : isDateKey(initialMonth)
      ? initialMonth
      : dateToKey(new Date());
  const [[visibleMonth, direction], setVisibleMonth] = useState<[Date, number]>(() => [
    dateKeyToDate(initialVisibleMonth),
    0,
  ]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON }),
      end: endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: WEEK_STARTS_ON }),
    });
  }, [visibleMonth]);

  function shiftMonth(amount: number) {
    setVisibleMonth(([current]) => [addMonths(current, amount), amount]);
  }

  const todayKey = dateToKey(new Date());
  const visibleMonthKey = format(visibleMonth, "yyyy-MM");

  return (
    <div className={cn("w-full min-w-0 rounded-xl border border-studio-border bg-studio-surface p-3 text-studio-ink", className)}>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          aria-label="Попередній місяць"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-center text-sm font-bold capitalize" aria-live="polite">
          {format(visibleMonth, "LLLL yyyy", { locale: uk })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          aria-label="Наступний місяць"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold uppercase tracking-wide text-studio-muted">
        {WEEKDAY_LABELS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="relative mt-2 overflow-hidden" role="grid" aria-label={label}>
        <AnimatePresence initial={false} mode="wait" custom={direction}>
          <motion.div
            key={visibleMonthKey}
            custom={direction}
            variants={shouldReduceMotion ? undefined : monthVariants}
            initial={shouldReduceMotion ? false : "enter"}
            animate="center"
            exit={shouldReduceMotion ? undefined : "exit"}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map((day) => {
              const dateKey = dateToKey(day);
              const selected = value === dateKey;
              const outside = !isSameMonth(day, visibleMonth);
              const today = dateKey === todayKey;
              const disabled =
                (minDate ? dateKey < minDate : false) ||
                (maxDate ? dateKey > maxDate : false) ||
                (disabledDate ? disabledDate(dateKey) : false);

              return (
                <motion.button
                  key={dateKey}
                  type="button"
                  role="gridcell"
                  aria-label={format(day, "EEEE, d MMMM yyyy", { locale: uk })}
                  aria-selected={selected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.96 }}
                  className={cn(
                    "flex aspect-square min-h-10 w-full items-center justify-center rounded-full border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent focus-visible:ring-offset-2 focus-visible:ring-offset-studio-surface",
                    today && !selected ? "border-studio-accent/45 bg-studio-accent-soft/60" : "border-transparent",
                    selected
                      ? "border-studio-accent bg-studio-accent text-studio-surface shadow-sm"
                      : outside
                        ? "text-studio-ink/70 hover:border-studio-accent/45 hover:bg-studio-accent-soft hover:text-studio-ink"
                        : "text-studio-ink hover:border-studio-accent/45 hover:bg-studio-accent-soft",
                    disabled
                      ? "cursor-not-allowed text-studio-muted/35 hover:border-transparent hover:bg-transparent hover:text-studio-muted/35"
                      : "cursor-pointer",
                  )}
                  onClick={() => onChange(dateKey)}
                >
                  {format(day, "d")}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

type DateCalendarPopoverProps = DateCalendarGridProps & {
  placeholder?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DateCalendarPopover({
  value,
  onChange,
  placeholder = "Оберіть дату",
  triggerClassName,
  align = "start",
  open,
  onOpenChange,
  ...calendarProps
}: DateCalendarPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const popoverOpen = isControlled ? open : internalOpen;
  const setPopoverOpen = onOpenChange ?? setInternalOpen;
  const hasValue = isDateKey(value);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-11 w-full justify-between gap-3 px-3 font-normal", triggerClassName)}
        >
          <span className={hasValue ? "truncate capitalize" : "truncate text-studio-muted"}>
            {hasValue ? formatDateKey(value, "d MMMM yyyy", { locale: uk }) : placeholder}
          </span>
          <CalendarDays className="size-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[min(calc(100vw-2rem),22rem)] p-2">
        <DateCalendarGrid
          key={value ?? calendarProps.initialMonth ?? "empty-calendar"}
          {...calendarProps}
          value={value}
          onChange={(dateKey) => {
            onChange(dateKey);
            setPopoverOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
