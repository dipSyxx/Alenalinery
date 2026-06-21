import { NextResponse } from "next/server";

import {
  BookingConflictError,
  BookingValidationError,
} from "@/lib/booking/create-booking";
import { createSupabaseBooking } from "@/lib/booking/create-supabase-booking";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Надішліть коректні дані запису." }, { status: 400 });
  }

  try {
    const booking = await createSupabaseBooking(body);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof BookingConflictError) {
      return NextResponse.json(
        { message: "На жаль, цей час щойно зайняли. Будь ласка, оберіть інший слот." },
        { status: 409 },
      );
    }

    console.error("Unable to create booking", error);
    return NextResponse.json({ message: "Не вдалося створити запис. Спробуйте ще раз." }, { status: 500 });
  }
}
