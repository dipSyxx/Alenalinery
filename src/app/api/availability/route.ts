import { NextResponse, type NextRequest } from "next/server";

import { getAvailabilityForDate } from "@/lib/booking/get-availability";
import { availabilityQuerySchema } from "@/lib/validation/availability";

export async function GET(request: NextRequest) {
  const parsed = availabilityQuerySchema.safeParse({
    serviceId: request.nextUrl.searchParams.get("serviceId"),
    date: request.nextUrl.searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Оберіть коректну послугу та дату." }, { status: 400 });
  }

  try {
    const availability = await getAvailabilityForDate(parsed.data);

    if (!availability) {
      return NextResponse.json({ message: "Обрана послуга зараз недоступна." }, { status: 404 });
    }

    return NextResponse.json({
      slots: availability.slots.map((slot) => slot.toISOString()),
    });
  } catch (error) {
    console.error("Unable to calculate booking availability", error);
    return NextResponse.json({ message: "Не вдалося завантажити вільний час." }, { status: 500 });
  }
}
