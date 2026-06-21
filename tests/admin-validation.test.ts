import { describe, expect, it } from "vitest";

import { adminBookingCreateSchema, bookingRescheduleSchema } from "@/lib/validation/admin";

describe("bookingRescheduleSchema", () => {
  it("accepts valid date and time", () => {
    const result = bookingRescheduleSchema.safeParse({ date: "2026-06-24", time: "13:30" });
    expect(result.success).toBe(true);
  });

  it("rejects malformed date (DD-MM-YYYY)", () => {
    const result = bookingRescheduleSchema.safeParse({ date: "24-06-2026", time: "13:30" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed time (single-digit hour)", () => {
    const result = bookingRescheduleSchema.safeParse({ date: "2026-06-24", time: "1:30" });
    expect(result.success).toBe(false);
  });
});

describe("adminBookingCreateSchema", () => {
  const validPayload = {
    serviceId: "550e8400-e29b-41d4-a716-446655440000",
    date: "2026-06-24",
    time: "10:00",
    name: "Олена",
    phone: "+380501234567",
  };

  it("accepts a valid payload", () => {
    const result = adminBookingCreateSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID serviceId", () => {
    const result = adminBookingCreateSchema.safeParse({ ...validPayload, serviceId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = adminBookingCreateSchema.safeParse({ ...validPayload, date: "2026/06/24" });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = adminBookingCreateSchema.safeParse({ ...validPayload, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty phone", () => {
    const result = adminBookingCreateSchema.safeParse({ ...validPayload, phone: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as empty strings", () => {
    const result = adminBookingCreateSchema.safeParse({
      ...validPayload,
      email: "",
      instagram: "",
      telegram: "",
      clientComment: "",
    });
    expect(result.success).toBe(true);
  });
});
