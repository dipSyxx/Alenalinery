import type { Prisma, PrismaClient } from "@prisma/client";

import type { BookingRepository } from "@/lib/booking/create-booking";
import { getDb } from "@/lib/db";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

function createRepository(client: DatabaseClient): BookingRepository {
  return {
    findServiceById: (id) =>
      client.service.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          basePriceUah: true,
          durationMinutes: true,
          bufferBeforeMinutes: true,
          bufferAfterMinutes: true,
          isActive: true,
          requiresDeposit: true,
          depositAmountUah: true,
        },
      }),
    findWorkingHoursByWeekday: (weekday) =>
      client.workingHours.findUnique({
        where: { weekday },
        select: { startTime: true, endTime: true, isWorkingDay: true },
      }),
    findBlockingBookings: (range) =>
      client.booking.findMany({
        where: {
          status: { in: ["PENDING_CONFIRMATION", "PENDING_PAYMENT", "CONFIRMED", "COMPLETED"] },
          occupiedFrom: { lt: range.occupiedUntil },
          occupiedUntil: { gt: range.occupiedFrom },
        },
        select: { startAt: true, occupiedFrom: true, occupiedUntil: true, status: true },
      }),
    findScheduleBlocks: (range) =>
      client.scheduleBlock.findMany({
        where: {
          startAt: { lt: range.occupiedUntil },
          endAt: { gt: range.occupiedFrom },
        },
        select: { startAt: true, endAt: true },
      }),
    findClientByPhone: (phone) => client.client.findUnique({ where: { phone }, select: { id: true } }),
    createClient: (clientData) => client.client.create({ data: clientData, select: { id: true } }),
    createBooking: (booking) => client.booking.create({ data: booking }),
    transaction: (operation) => operation(createRepository(client)),
  };
}

export function getPrismaBookingRepository(): BookingRepository {
  const client = getDb();
  const repository = createRepository(client);

  return {
    ...repository,
    transaction: (operation) =>
      client.$transaction((transactionClient) => operation(createRepository(transactionClient))),
  };
}
