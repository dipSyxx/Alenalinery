import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { BookingConflictError, BookingValidationError } from "@/lib/booking/create-booking";
import { BookingNotFoundError, rescheduleAdminBooking } from "@/lib/data/supabase";
import { bookingRescheduleSchema } from "@/lib/validation/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = bookingRescheduleSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Перевірте дату та час перенесення." }, { status: 400 });
  }

  try {
    const booking = await rescheduleAdminBooking(id, parsed.data.date, parsed.data.time);
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ message: "Цей час вже зайнятий." }, { status: 409 });
    }
    if (error instanceof BookingNotFoundError) {
      return NextResponse.json({ message: "Запис не знайдено." }, { status: 404 });
    }
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Не вдалося перенести запис." }, { status: 500 });
  }
}
