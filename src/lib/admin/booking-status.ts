export const bookingStatuses = [
  "PENDING_CONFIRMATION",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "EXPIRED",
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

const transitions: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING_CONFIRMATION: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  EXPIRED: [],
};

export class BookingStatusTransitionError extends Error {
  constructor() {
    super("Недопустима зміна статусу запису.");
    this.name = "BookingStatusTransitionError";
  }
}

export function getAllowedBookingStatuses(status: BookingStatus): readonly BookingStatus[] {
  return transitions[status] ?? [];
}

export function assertBookingStatusTransition(current: BookingStatus, next: BookingStatus): void {
  const allowed = getAllowedBookingStatuses(current);
  if (!allowed.includes(next)) {
    throw new BookingStatusTransitionError();
  }
}
