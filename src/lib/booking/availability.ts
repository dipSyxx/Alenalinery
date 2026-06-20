import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "EXPIRED";

export type ServiceTiming = {
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
};

export type WorkingDay = {
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
};

export type BookingInterval = {
  startAt: Date;
  occupiedFrom?: Date;
  occupiedUntil: Date;
  status: BookingStatus;
};

export type ScheduleBlockInterval = {
  startAt: Date;
  endAt: Date;
};

type SlotAvailabilityInput = {
  slotStartAt: Date;
  service: ServiceTiming;
  workingHours: WorkingDay;
  existingBookings: BookingInterval[];
  scheduleBlocks: ScheduleBlockInterval[];
  workingDayStartAt?: Date;
  workingDayEndAt?: Date;
};

type AvailableSlotsInput = Omit<SlotAvailabilityInput, "slotStartAt"> & {
  date: string;
  timeZone: string;
  slotIntervalMinutes: number;
};

export const BLOCKING_BOOKING_STATUSES = new Set<BookingStatus>([
  "PENDING_CONFIRMATION",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
]);

export function getSlotInterval(slotStartAt: Date, service: ServiceTiming) {
  const endAt = addMinutes(slotStartAt, service.durationMinutes);

  return {
    startAt: slotStartAt,
    endAt,
    occupiedFrom: addMinutes(slotStartAt, -service.bufferBeforeMinutes),
    occupiedUntil: addMinutes(endAt, service.bufferAfterMinutes),
  };
}

export function isSlotAvailable({
  slotStartAt,
  service,
  workingHours,
  existingBookings,
  scheduleBlocks,
  workingDayStartAt,
  workingDayEndAt,
}: SlotAvailabilityInput): boolean {
  if (!workingHours.isWorkingDay) {
    return false;
  }

  const candidate = getSlotInterval(slotStartAt, service);

  if (workingDayStartAt && isBefore(candidate.occupiedFrom, workingDayStartAt)) {
    return false;
  }

  if (workingDayEndAt && isBefore(workingDayEndAt, candidate.occupiedUntil)) {
    return false;
  }

  const conflictsWithBooking = existingBookings.some((booking) => {
    if (!BLOCKING_BOOKING_STATUSES.has(booking.status)) {
      return false;
    }

    return intervalsOverlap(
      candidate.occupiedFrom,
      candidate.occupiedUntil,
      booking.occupiedFrom ?? booking.startAt,
      booking.occupiedUntil,
    );
  });

  if (conflictsWithBooking) {
    return false;
  }

  return !scheduleBlocks.some((block) =>
    intervalsOverlap(candidate.occupiedFrom, candidate.occupiedUntil, block.startAt, block.endAt),
  );
}

export function getAvailableSlots({
  date,
  timeZone,
  slotIntervalMinutes,
  service,
  workingHours,
  existingBookings,
  scheduleBlocks,
}: AvailableSlotsInput): Date[] {
  if (!workingHours.isWorkingDay || slotIntervalMinutes <= 0) {
    return [];
  }

  const workingDayStartAt = fromZonedTime(`${date}T${workingHours.startTime}:00`, timeZone);
  const workingDayEndAt = fromZonedTime(`${date}T${workingHours.endTime}:00`, timeZone);
  const slots: Date[] = [];

  for (
    let slotStartAt = workingDayStartAt;
    isBefore(slotStartAt, workingDayEndAt);
    slotStartAt = addMinutes(slotStartAt, slotIntervalMinutes)
  ) {
    if (
      isSlotAvailable({
        slotStartAt,
        service,
        workingHours,
        existingBookings,
        scheduleBlocks,
        workingDayStartAt,
        workingDayEndAt,
      })
    ) {
      slots.push(slotStartAt);
    }
  }

  return slots;
}

function intervalsOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return isBefore(startA, endB) && isBefore(startB, endA);
}
