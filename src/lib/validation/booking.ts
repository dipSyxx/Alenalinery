import { format, isValid, parseISO } from "date-fns";
import { z } from "zod";

import { normalizeUkrainianPhone } from "@/lib/validation/phone";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function isCalendarDate(value: string): boolean {
  const parsed = parseISO(value);

  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export const createBookingInputSchema = z.object({
  serviceId: z.string().trim().min(1, "Оберіть послугу."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Оберіть коректну дату.")
    .refine(isCalendarDate, "Оберіть коректну дату."),
  time: z.string().regex(timePattern, "Оберіть коректний час."),
  name: z.string().trim().min(2, "Вкажіть ім’я.").max(100, "Ім’я надто довге."),
  phone: z
    .string()
    .trim()
    .refine((value) => normalizeUkrainianPhone(value) !== null, "Вкажіть український номер телефону."),
  email: z.string().trim().email("Вкажіть коректний email.").max(254).optional().or(z.literal("")),
  instagram: z.string().trim().max(100, "Instagram надто довгий.").optional().or(z.literal("")),
  telegram: z.string().trim().max(100, "Telegram надто довгий.").optional().or(z.literal("")),
  clientComment: z.string().trim().max(1000, "Коментар надто довгий.").optional().or(z.literal("")),
});

export type CreateBookingInput = z.input<typeof createBookingInputSchema>;
