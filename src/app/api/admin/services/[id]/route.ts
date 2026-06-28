import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { BookingValidationError } from "@/lib/booking/create-booking";
import { updateAdminService } from "@/lib/data/supabase";
import { adminServiceUpdateSchema } from "@/lib/validation/admin";

const serviceIdSchema = z.string().uuid();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = serviceIdSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ message: "Некоректний ідентифікатор послуги." }, { status: 400 });
  }

  const parsed = adminServiceUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Перевірте дані послуги." }, { status: 400 });
  }

  try {
    const service = await updateAdminService(parsedId.data, parsed.data);
    return NextResponse.json({ service });
  } catch (error) {
    if (error instanceof BookingValidationError && error.message === "SERVICE_NOT_FOUND") {
      return NextResponse.json({ message: "Послугу не знайдено." }, { status: 404 });
    }

    return NextResponse.json({ message: "Не вдалося оновити послугу." }, { status: 500 });
  }
}
