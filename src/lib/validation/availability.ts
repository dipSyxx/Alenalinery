import { format, isValid, parseISO } from "date-fns";
import { z } from "zod";

export const availabilityQuerySchema = z.object({
  serviceId: z.string().trim().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = parseISO(value);
      return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
    }),
});
