import { NextResponse } from "next/server";

import { BookingStatusTransitionError } from "@/lib/admin/booking-status";
import { getAdminProfileForApi } from "@/lib/auth/admin";
import { BookingNotFoundError, updateAdminBooking } from "@/lib/data/supabase";
import { bookingUpdateSchema } from "@/lib/validation/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const parsed = bookingUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Перевірте дані оновлення." }, { status: 400 });
  }

  const { id } = await params;

  try {
    const booking = await updateAdminBooking(id, parsed.data);
    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof BookingStatusTransitionError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof BookingNotFoundError) {
      return NextResponse.json({ message: "Запис не знайдено." }, { status: 404 });
    }
    return NextResponse.json({ message: "Не вдалося оновити запис." }, { status: 500 });
  }
}
