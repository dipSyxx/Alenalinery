import { describe, expect, it } from "vitest";

import {
  BookingConflictError,
  createBooking,
  type BookingRepository,
} from "@/lib/booking/create-booking";

const service = {
  id: "service-1",
  name: "Жіноча стрижка",
  basePriceUah: 900,
  durationMinutes: 60,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  isActive: true,
  requiresDeposit: false,
  depositAmountUah: null,
};

function createRepository(overrides: Partial<BookingRepository> = {}): BookingRepository {
  return {
    findServiceById: async () => service,
    findWorkingHoursByWeekday: async () => ({
      startTime: "10:00",
      endTime: "18:00",
      isWorkingDay: true,
    }),
    findBlockingBookings: async () => [],
    findScheduleBlocks: async () => [],
    findClientByPhone: async () => null,
    createClient: async (client) => ({ id: "client-1", ...client }),
    createBooking: async (booking) => ({ id: "booking-1", ...booking }),
    transaction: async (operation) => operation(createRepository(overrides)),
    ...overrides,
  };
}

const validInput = {
  serviceId: "service-1",
  date: "2026-06-23",
  time: "10:00",
  name: "Олена Коваль",
  phone: "(050) 123-45-67",
};

describe("createBooking", () => {
  it("rejects an invalid Ukrainian phone, date, or service payload before accessing data", async () => {
    const repository = createRepository();

    await expect(
      createBooking(
        { ...validInput, serviceId: "", date: "23-06-2026", phone: "123" },
        { repository, timeZone: "Europe/Kyiv" },
      ),
    ).rejects.toThrow();
  });

  it("rejects a slot that becomes unavailable during booking submission", async () => {
    let bookingLookupCount = 0;
    const repository = createRepository({
      findBlockingBookings: async () => {
        bookingLookupCount += 1;

        return bookingLookupCount === 1
          ? []
          : [
              {
                startAt: new Date("2026-06-23T07:00:00.000Z"),
                occupiedFrom: new Date("2026-06-23T07:00:00.000Z"),
                occupiedUntil: new Date("2026-06-23T08:15:00.000Z"),
                status: "CONFIRMED" as const,
              },
            ];
      },
    });

    await expect(createBooking(validInput, { repository, timeZone: "Europe/Kyiv" })).rejects.toBeInstanceOf(
      BookingConflictError,
    );
    expect(bookingLookupCount).toBe(2);
  });
});
