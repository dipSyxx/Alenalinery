import { BookingConflictError, BookingValidationError, parseBookingInput } from "@/lib/booking/create-booking";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { normalizeUkrainianPhone } from "@/lib/validation/phone";

export async function createSupabaseBooking(input: unknown) {
  const payload = parseBookingInput(input);
  const phone = normalizeUkrainianPhone(payload.phone);

  if (!phone) {
    throw new BookingValidationError("Вкажіть український номер телефону.");
  }

  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase.rpc("create_booking", {
    p_service_id: payload.serviceId,
    p_date: payload.date,
    p_time: payload.time,
    p_client_name: payload.name,
    p_phone: phone,
    p_email: toOptionalText(payload.email),
    p_instagram: toOptionalText(payload.instagram),
    p_telegram: toOptionalText(payload.telegram),
    p_client_comment: toOptionalText(payload.clientComment),
  });

  if (result.error) {
    throwBookingError(result.error.message);
  }

  const booking = Array.isArray(result.data) ? result.data[0] : result.data;

  if (!booking) {
    throw new Error("Supabase did not return the created booking.");
  }

  return booking;
}

function throwBookingError(message: string): never {
  if (message === "BOOKING_CONFLICT") {
    throw new BookingConflictError();
  }

  if (message === "SERVICE_UNAVAILABLE") {
    throw new BookingValidationError("Обрана послуга зараз недоступна.");
  }

  if (message === "BOOKING_IN_PAST") {
    throw new BookingValidationError("Неможливо записатися на минулий час.");
  }

  if (message === "INVALID_BOOKING_INPUT") {
    throw new BookingValidationError("Перевірте дані запису.");
  }

  throw new Error(`Unable to create booking: ${message}`);
}

function toOptionalText(value: string | undefined): string | null {
  return value?.trim() || null;
}
