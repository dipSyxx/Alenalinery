import { describe, expect, it } from "vitest";

import {
  getAvailableSlots,
  isSlotAvailable,
  type BookingInterval,
  type ScheduleBlockInterval,
} from "@/lib/booking/availability";

const service = {
  durationMinutes: 90,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 30,
};

const workingHours = { startTime: "10:00", endTime: "18:00", isWorkingDay: true };

describe("booking availability", () => {
  it("excludes a slot that overlaps an existing confirmed booking", () => {
    const existing: BookingInterval[] = [
      {
        startAt: new Date("2026-06-23T10:30:00.000Z"),
        occupiedUntil: new Date("2026-06-23T12:30:00.000Z"),
        status: "CONFIRMED",
      },
    ];

    expect(
      isSlotAvailable({
        slotStartAt: new Date("2026-06-23T10:00:00.000Z"),
        service,
        workingHours,
        existingBookings: existing,
        scheduleBlocks: [],
      }),
    ).toBe(false);
  });

  it("excludes a slot when its occupied interval extends after closing time", () => {
    expect(
      isSlotAvailable({
        slotStartAt: new Date("2026-06-23T16:30:00.000Z"),
        service,
        workingHours,
        existingBookings: [],
        scheduleBlocks: [],
        workingDayStartAt: new Date("2026-06-23T10:00:00.000Z"),
        workingDayEndAt: new Date("2026-06-23T18:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("does not let a cancelled booking block an otherwise valid slot", () => {
    const cancelled: BookingInterval[] = [
      {
        startAt: new Date("2026-06-23T10:00:00.000Z"),
        occupiedUntil: new Date("2026-06-23T12:00:00.000Z"),
        status: "CANCELLED",
      },
    ];

    expect(
      isSlotAvailable({
        slotStartAt: new Date("2026-06-23T10:00:00.000Z"),
        service,
        workingHours,
        existingBookings: cancelled,
        scheduleBlocks: [],
      }),
    ).toBe(true);
  });

  it("excludes a slot that intersects a schedule block", () => {
    const scheduleBlocks: ScheduleBlockInterval[] = [
      {
        startAt: new Date("2026-06-23T11:00:00.000Z"),
        endAt: new Date("2026-06-23T12:00:00.000Z"),
      },
    ];

    expect(
      isSlotAvailable({
        slotStartAt: new Date("2026-06-23T10:30:00.000Z"),
        service,
        workingHours,
        existingBookings: [],
        scheduleBlocks,
      }),
    ).toBe(false);
  });

  it("returns only slots whose full occupied interval is available", () => {
    const slots = getAvailableSlots({
      date: "2026-06-23",
      timeZone: "UTC",
      slotIntervalMinutes: 30,
      service,
      workingHours,
      existingBookings: [],
      scheduleBlocks: [],
    });

    expect(slots.at(-1)?.toISOString()).toBe("2026-06-23T16:00:00.000Z");
  });
});
