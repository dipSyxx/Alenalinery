import { describe, expect, it } from "vitest";

import {
  BookingStatusTransitionError,
  assertBookingStatusTransition,
  getAllowedBookingStatuses,
} from "@/lib/admin/booking-status";

describe("booking lifecycle transitions", () => {
  it("PENDING_CONFIRMATION allows CONFIRMED, CANCELLED, NO_SHOW", () => {
    expect(getAllowedBookingStatuses("PENDING_CONFIRMATION")).toEqual(["CONFIRMED", "CANCELLED", "NO_SHOW"]);
  });

  it("CONFIRMED allows COMPLETED, CANCELLED, NO_SHOW", () => {
    expect(getAllowedBookingStatuses("CONFIRMED")).toEqual(["COMPLETED", "CANCELLED", "NO_SHOW"]);
  });

  it("PENDING_PAYMENT allows CONFIRMED, CANCELLED, EXPIRED", () => {
    expect(getAllowedBookingStatuses("PENDING_PAYMENT")).toEqual(["CONFIRMED", "CANCELLED", "EXPIRED"]);
  });

  it("COMPLETED has no allowed next state", () => {
    expect(getAllowedBookingStatuses("COMPLETED")).toEqual([]);
  });

  it("CANCELLED has no allowed next state", () => {
    expect(getAllowedBookingStatuses("CANCELLED")).toEqual([]);
  });

  it("NO_SHOW has no allowed next state", () => {
    expect(getAllowedBookingStatuses("NO_SHOW")).toEqual([]);
  });

  it("EXPIRED has no allowed next state", () => {
    expect(getAllowedBookingStatuses("EXPIRED")).toEqual([]);
  });

  it("throws BookingStatusTransitionError for invalid transition COMPLETED → CONFIRMED", () => {
    expect(() => assertBookingStatusTransition("COMPLETED", "CONFIRMED")).toThrow(BookingStatusTransitionError);
  });

  it("does not throw for a valid transition PENDING_CONFIRMATION → CONFIRMED", () => {
    expect(() => assertBookingStatusTransition("PENDING_CONFIRMATION", "CONFIRMED")).not.toThrow();
  });
});
