import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { createSupabaseBooking } from "@/lib/booking/create-supabase-booking";
import { BookingConflictError, BookingValidationError } from "@/lib/booking/create-booking";
import { getAdminBookings } from "@/lib/data/supabase";
import { adminBookingCreateSchema } from "@/lib/validation/admin";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const bookings = await getAdminBookings({ limit: 100 });

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const parsed = adminBookingCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Перевірте дані запису." }, { status: 400 });
  }

  try {
    const booking = await createSupabaseBooking(parsed.data, "ADMIN");
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ message: "Цей час вже зайнятий." }, { status: 409 });
    }
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Не вдалося створити запис." }, { status: 500 });
  }
}
