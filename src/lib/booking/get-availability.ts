import { isBefore } from "date-fns";

import { getAvailableSlots } from "@/lib/booking/availability";
import {
  getActiveService,
  getBlockingBookingIntervals,
  getScheduleBlockIntervals,
  getWorkingHoursByWeekday,
} from "@/lib/data/supabase";
import { BUSINESS_TIME_ZONE, getWeekdayInTimeZone, getZonedDateTime } from "@/lib/timezone";

export async function getAvailabilityForDate({
  serviceId,
  date,
  now = new Date(),
}: {
  serviceId: string;
  date: string;
  now?: Date;
}) {
  const service = await getActiveService(serviceId);

  if (!service) {
    return null;
  }

  const referenceAt = getZonedDateTime(date, "12:00");
  const workingHours = await getWorkingHoursByWeekday(getWeekdayInTimeZone(referenceAt, BUSINESS_TIME_ZONE));

  if (!workingHours?.isWorkingDay) {
    return { service, slots: [] };
  }

  const workingDayStartAt = getZonedDateTime(date, workingHours.startTime);
  const workingDayEndAt = getZonedDateTime(date, workingHours.endTime);
  const [existingBookings, scheduleBlocks] = await Promise.all([
    getBlockingBookingIntervals({ occupiedFrom: workingDayStartAt, occupiedUntil: workingDayEndAt }),
    getScheduleBlockIntervals({ occupiedFrom: workingDayStartAt, occupiedUntil: workingDayEndAt }),
  ]);

  const slots = getAvailableSlots({
    date,
    timeZone: BUSINESS_TIME_ZONE,
    slotIntervalMinutes: 30,
    service,
    workingHours,
    existingBookings,
    scheduleBlocks,
  }).filter((slot) => isBefore(now, slot));

  return { service, slots };
}
