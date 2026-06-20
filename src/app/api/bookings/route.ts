import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  BookingConflictError,
  BookingValidationError,
  createBooking,
} from "@/lib/booking/create-booking";
import { getPrismaBookingRepository } from "@/lib/booking/prisma-repository";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Надішліть коректні дані запису." }, { status: 400 });
  }

  try {
    const booking = await createBooking(body, { repository: getPrismaBookingRepository() });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof BookingConflictError || isOverlapViolation(error)) {
      return NextResponse.json(
        { message: "На жаль, цей час щойно зайняли. Будь ласка, оберіть інший слот." },
        { status: 409 },
      );
    }

    console.error("Unable to create booking", error);
    return NextResponse.json({ message: "Не вдалося створити запис. Спробуйте ще раз." }, { status: 500 });
  }
}

function isOverlapViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.message.includes("Booking_active_occupied_range_excl")
  );
}
