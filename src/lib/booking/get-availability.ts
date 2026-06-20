import { isBefore } from "date-fns";

import { getAvailableSlots } from "@/lib/booking/availability";
import { getDb } from "@/lib/db";
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
  const db = getDb();
  const service = await db.service.findFirst({ where: { id: serviceId, isActive: true } });

  if (!service) {
    return null;
  }

  const referenceAt = getZonedDateTime(date, "12:00");
  const workingHours = await db.workingHours.findUnique({
    where: { weekday: getWeekdayInTimeZone(referenceAt, BUSINESS_TIME_ZONE) },
  });

  if (!workingHours?.isWorkingDay) {
    return { service, slots: [] };
  }

  const workingDayStartAt = getZonedDateTime(date, workingHours.startTime);
  const workingDayEndAt = getZonedDateTime(date, workingHours.endTime);
  const [existingBookings, scheduleBlocks] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { in: ["PENDING_CONFIRMATION", "PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] },
        occupiedFrom: { lt: workingDayEndAt },
        occupiedUntil: { gt: workingDayStartAt },
      },
      select: { startAt: true, occupiedFrom: true, occupiedUntil: true, status: true },
    }),
    db.scheduleBlock.findMany({
      where: { startAt: { lt: workingDayEndAt }, endAt: { gt: workingDayStartAt } },
      select: { startAt: true, endAt: true },
    }),
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
