import { z } from "zod";

import { bookingStatuses } from "@/lib/admin/booking-status";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const nonNegativeInteger = z.coerce.number().int().min(0);
const positiveInteger = z.coerce.number().int().positive();

export const bookingUpdateSchema = z.object({
  status: z.enum(bookingStatuses).optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
});

export const bookingRescheduleSchema = z.object({
  date: z.string().regex(datePattern),
  time: z.string().regex(timePattern),
});

export const adminBookingCreateSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(datePattern),
  time: z.string().regex(timePattern),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  email: z.string().trim().email().optional().or(z.literal("")),
  instagram: z.string().trim().max(100).optional().or(z.literal("")),
  telegram: z.string().trim().max(100).optional().or(z.literal("")),
  clientComment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const workingHoursUpdateSchema = z.object({
  kind: z.literal("working-hours"),
  id: z.string().uuid(),
  startTime: z.string().regex(timePattern),
  endTime: z.string().regex(timePattern),
  isWorkingDay: z.boolean(),
});

export const scheduleBlockCreateSchema = z
  .object({
    kind: z.literal("schedule-block"),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.startAt < value.endAt, { message: "Час завершення має бути пізніше за початок." });

const adminServiceBaseSchema = z
  .object({
    categoryId: z.string().uuid(),
    name: z.string().trim().min(2).max(140),
    description: z.string().trim().max(1200).optional().or(z.literal("")),
    basePriceUah: nonNegativeInteger,
    durationMinutes: positiveInteger.max(600),
    bufferBeforeMinutes: nonNegativeInteger.max(180),
    bufferAfterMinutes: nonNegativeInteger.max(180),
    requiresConsultation: z.boolean(),
    requiresDeposit: z.boolean(),
    depositAmountUah: nonNegativeInteger.nullish(),
    isActive: z.boolean(),
    sortOrder: z.coerce.number().int().min(-10000).max(10000),
  })
  .refine((value) => !value.requiresDeposit || (value.depositAmountUah ?? 0) > 0, {
    message: "Вкажіть суму депозиту.",
    path: ["depositAmountUah"],
  })
  .transform((value) => ({
    ...value,
    description: value.description ?? "",
    depositAmountUah: value.requiresDeposit ? value.depositAmountUah ?? 0 : null,
  }));

export const adminServiceCreateSchema = adminServiceBaseSchema;
export const adminServiceUpdateSchema = adminServiceBaseSchema;
