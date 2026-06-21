import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { BookingValidationError } from "@/lib/booking/create-booking";
import { deleteScheduleBlock } from "@/lib/data/supabase";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteScheduleBlock(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof BookingValidationError && error.message === "SCHEDULE_BLOCK_NOT_FOUND") {
      return NextResponse.json({ message: "Блокування не знайдено." }, { status: 404 });
    }
    return NextResponse.json({ message: "Не вдалося видалити блокування." }, { status: 500 });
  }
}
