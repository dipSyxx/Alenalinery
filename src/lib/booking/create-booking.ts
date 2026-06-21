import { isBefore } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ZodError } from "zod";

import {
  getSlotInterval,
  isSlotAvailable,
  type BookingInterval,
  type ScheduleBlockInterval,
  type WorkingDay,
} from "@/lib/booking/availability";
import { BUSINESS_TIME_ZONE, getWeekdayInTimeZone, getZonedDateTime } from "@/lib/timezone";
import { createBookingInputSchema } from "@/lib/validation/booking";
import { normalizeUkrainianPhone } from "@/lib/validation/phone";

export type BookingService = {
  id: string;
  name: string;
  basePriceUah: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
  requiresDeposit: boolean;
  depositAmountUah: number | null;
};

type BookingClient = { id: string };

type BookingRange = {
  occupiedFrom: Date;
  occupiedUntil: Date;
};

type NewClient = {
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  telegram?: string;
};

type NewBooking = {
  clientId: string;
  serviceId: string;
  startAt: Date;
  endAt: Date;
  occupiedFrom: Date;
  occupiedUntil: Date;
  status: "PENDING_CONFIRMATION";
  totalPriceUah: number;
  depositAmountUah: number;
  paymentStatus: "NOT_REQUIRED" | "PENDING";
  clientComment?: string;
  source: "WEBSITE";
};

export type BookingRepository = {
  findServiceById(id: string): Promise<BookingService | null>;
  findWorkingHoursByWeekday(weekday: number): Promise<WorkingDay | null>;
  findBlockingBookings(range: BookingRange): Promise<BookingInterval[]>;
  findScheduleBlocks(range: BookingRange): Promise<ScheduleBlockInterval[]>;
  findClientByPhone(phone: string): Promise<BookingClient | null>;
  createClient(client: NewClient): Promise<BookingClient>;
  createBooking(booking: NewBooking): Promise<unknown>;
  transaction<T>(operation: (repository: BookingRepository) => Promise<T>): Promise<T>;
};

export class BookingConflictError extends Error {
  constructor() {
    super("На жаль, цей час щойно зайняли. Будь ласка, оберіть інший слот.");
    this.name = "BookingConflictError";
  }
}

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingValidationError";
  }
}

export async function createBooking(
  input: unknown,
  {
    repository,
    timeZone = BUSINESS_TIME_ZONE,
    now = new Date(),
  }: { repository: BookingRepository; timeZone?: string; now?: Date },
) {
  const payload = parseBookingInput(input);
  const startAt = getZonedDateTime(payload.date, payload.time, timeZone);

  if (isBefore(startAt, now)) {
    throw new BookingValidationError("Неможливо записатися на минулий час.");
  }

  const service = await repository.findServiceById(payload.serviceId);

  if (!service || !service.isActive) {
    throw new BookingValidationError("Обрана послуга зараз недоступна.");
  }

  const workingHours = await repository.findWorkingHoursByWeekday(getWeekdayInTimeZone(startAt, timeZone));

  if (!workingHours?.isWorkingDay) {
    throw new BookingConflictError();
  }

  const slot = getSlotInterval(startAt, service);
  const range = { occupiedFrom: slot.occupiedFrom, occupiedUntil: slot.occupiedUntil };

  await assertAvailability({ repository, startAt, service, workingHours, range, timeZone });

  return repository.transaction(async (transactionRepository) => {
    await assertAvailability({
      repository: transactionRepository,
      startAt,
      service,
      workingHours,
      range,
      timeZone,
    });

    const phone = normalizeUkrainianPhone(payload.phone);

    if (!phone) {
      throw new BookingValidationError("Вкажіть український номер телефону.");
    }

    const client =
      (await transactionRepository.findClientByPhone(phone)) ??
      (await transactionRepository.createClient({
        name: payload.name,
        phone,
        email: nonEmpty(payload.email),
        instagram: nonEmpty(payload.instagram),
        telegram: nonEmpty(payload.telegram),
      }));

    return transactionRepository.createBooking({
      clientId: client.id,
      serviceId: service.id,
      startAt: slot.startAt,
      endAt: slot.endAt,
      occupiedFrom: slot.occupiedFrom,
      occupiedUntil: slot.occupiedUntil,
      status: "PENDING_CONFIRMATION",
      totalPriceUah: service.basePriceUah,
      depositAmountUah: service.requiresDeposit ? (service.depositAmountUah ?? 0) : 0,
      paymentStatus: service.requiresDeposit ? "PENDING" : "NOT_REQUIRED",
      clientComment: nonEmpty(payload.clientComment),
      source: "WEBSITE",
    });
  });
}

async function assertAvailability({
  repository,
  startAt,
  service,
  workingHours,
  range,
  timeZone,
}: {
  repository: BookingRepository;
  startAt: Date;
  service: BookingService;
  workingHours: WorkingDay;
  range: BookingRange;
  timeZone: string;
}): Promise<void> {
  const [existingBookings, scheduleBlocks] = await Promise.all([
    repository.findBlockingBookings(range),
    repository.findScheduleBlocks(range),
  ]);

  const localDate = formatInTimeZone(startAt, timeZone, "yyyy-MM-dd");
  const dayStartAt = getZonedDateTime(localDate, workingHours.startTime, timeZone);
  const dayEndAt = getZonedDateTime(localDate, workingHours.endTime, timeZone);

  if (
    !isSlotAvailable({
      slotStartAt: startAt,
      service,
      workingHours,
      existingBookings,
      scheduleBlocks,
      workingDayStartAt: dayStartAt,
      workingDayEndAt: dayEndAt,
    })
  ) {
    throw new BookingConflictError();
  }
}

export function parseBookingInput(input: unknown) {
  try {
    return createBookingInputSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BookingValidationError(error.issues[0]?.message ?? "Перевірте дані запису.");
    }

    throw error;
  }
}

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}
