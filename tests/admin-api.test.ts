import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only before any imports that use it
vi.mock("server-only", () => ({}));

// Mock auth
vi.mock("@/lib/auth/admin", () => ({
  getAdminProfileForApi: vi.fn(),
}));

// Mock data layer — preserve real error classes, override only functions
vi.mock("@/lib/data/supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/supabase")>();
  return {
    ...actual,
    getAdminBookings: vi.fn(),
    getAdminBookingById: vi.fn(),
    updateAdminBooking: vi.fn(),
    rescheduleAdminBooking: vi.fn(),
    deleteScheduleBlock: vi.fn(),
  };
});

// Mock booking creation
vi.mock("@/lib/booking/create-supabase-booking", () => ({
  createSupabaseBooking: vi.fn(),
}));

import { getAdminProfileForApi } from "@/lib/auth/admin";
import {
  BookingNotFoundError,
  deleteScheduleBlock,
  rescheduleAdminBooking,
  updateAdminBooking,
} from "@/lib/data/supabase";
import { createSupabaseBooking } from "@/lib/booking/create-supabase-booking";
import { BookingConflictError, BookingValidationError } from "@/lib/booking/create-booking";
import { BookingStatusTransitionError } from "@/lib/admin/booking-status";

const mockAdmin = { id: "admin-1", displayName: "Адмін", role: "ADMIN" as const };

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/test", {
    method,
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "Content-Type": "application/json" } : {},
  });
}

function mockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── GET /api/admin/bookings ─────────────────────────────────────────────────

describe("GET /api/admin/bookings", () => {
  it("returns 401 without admin", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/bookings/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/admin/bookings (manual creation) ──────────────────────────────

describe("POST /api/admin/bookings", () => {
  it("returns 401 without admin before parsing body", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/bookings/route");
    const res = await POST(makeRequest("POST", {}));
    expect(res.status).toBe(401);
    expect(vi.mocked(createSupabaseBooking)).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid body", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    const { POST } = await import("@/app/api/admin/bookings/route");
    const res = await POST(makeRequest("POST", { serviceId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 with created booking", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    const booking = { id: "b1", source: "ADMIN" };
    vi.mocked(createSupabaseBooking).mockResolvedValue(booking);
    const { POST } = await import("@/app/api/admin/bookings/route");
    const res = await POST(makeRequest("POST", {
      serviceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-06-30",
      time: "11:00",
      name: "Тест",
      phone: "+380501234567",
    }));
    expect(res.status).toBe(201);
    const body = await res.json() as { booking: unknown };
    expect(body.booking).toEqual(booking);
  });

  it("returns 409 for booking conflict", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    vi.mocked(createSupabaseBooking).mockRejectedValue(new BookingConflictError());
    const { POST } = await import("@/app/api/admin/bookings/route");
    const res = await POST(makeRequest("POST", {
      serviceId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2026-06-30",
      time: "11:00",
      name: "Тест",
      phone: "+380501234567",
    }));
    expect(res.status).toBe(409);
  });
});

// ─── PATCH /api/admin/bookings/[id] (status/notes) ──────────────────────────

describe("PATCH /api/admin/bookings/[id]", () => {
  it("returns 401 without admin", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/bookings/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { status: "CONFIRMED" }), mockParams("b1"));
    expect(res.status).toBe(401);
    expect(vi.mocked(updateAdminBooking)).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid lifecycle change", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    vi.mocked(updateAdminBooking).mockRejectedValue(new BookingStatusTransitionError());
    const { PATCH } = await import("@/app/api/admin/bookings/[id]/route");
    const res = await PATCH(makeRequest("PATCH", { status: "CONFIRMED" }), mockParams("b1"));
    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/admin/bookings/[id]/reschedule ──────────────────────────────

describe("PATCH /api/admin/bookings/[id]/reschedule", () => {
  it("returns 401 without admin before parsing body", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/bookings/[id]/reschedule/route");
    const res = await PATCH(makeRequest("PATCH", {}), mockParams("b1"));
    expect(res.status).toBe(401);
    expect(vi.mocked(rescheduleAdminBooking)).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed reschedule body", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    const { PATCH } = await import("@/app/api/admin/bookings/[id]/reschedule/route");
    const res = await PATCH(makeRequest("PATCH", { date: "bad", time: "bad" }), mockParams("b1"));
    expect(res.status).toBe(400);
  });

  it("returns 409 for BookingConflictError", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    vi.mocked(rescheduleAdminBooking).mockRejectedValue(new BookingConflictError());
    const { PATCH } = await import("@/app/api/admin/bookings/[id]/reschedule/route");
    const res = await PATCH(makeRequest("PATCH", { date: "2026-06-30", time: "11:00" }), mockParams("b1"));
    expect(res.status).toBe(409);
  });

  it("returns 404 for unknown booking", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    vi.mocked(rescheduleAdminBooking).mockRejectedValue(new BookingNotFoundError());
    const { PATCH } = await import("@/app/api/admin/bookings/[id]/reschedule/route");
    const res = await PATCH(makeRequest("PATCH", { date: "2026-06-30", time: "11:00" }), mockParams("b1"));
    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/admin/schedule/[id] ────────────────────────────────────────

describe("DELETE /api/admin/schedule/[id]", () => {
  it("returns 401 without admin", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/admin/schedule/[id]/route");
    const res = await DELETE(makeRequest("DELETE"), mockParams("s1"));
    expect(res.status).toBe(401);
    expect(vi.mocked(deleteScheduleBlock)).not.toHaveBeenCalled();
  });

  it("returns 204 for successful deletion", async () => {
    vi.mocked(getAdminProfileForApi).mockResolvedValue(mockAdmin);
    vi.mocked(deleteScheduleBlock).mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/admin/schedule/[id]/route");
    const res = await DELETE(makeRequest("DELETE"), mockParams("s1"));
    expect(res.status).toBe(204);
  });
});
