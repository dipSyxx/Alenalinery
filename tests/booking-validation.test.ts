import { describe, expect, it } from "vitest";

import { createBookingInputSchema } from "@/lib/validation/booking";

describe("booking validation", () => {
  it("accepts a valid calendar date regardless of the local machine time zone", () => {
    const result = createBookingInputSchema.safeParse({
      serviceId: "service-1",
      date: "2026-06-23",
      time: "10:00",
      name: "Олена Коваль",
      phone: "050 123 45 67",
    });

    expect(result.success).toBe(true);
  });
});
