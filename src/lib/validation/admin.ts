import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingUpdateSchema = z.object({
  status: z
    .enum(["PENDING_CONFIRMATION", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW", "PENDING_PAYMENT", "EXPIRED"])
    .optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
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
