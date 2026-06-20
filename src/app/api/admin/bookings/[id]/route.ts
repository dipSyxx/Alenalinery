import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
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
  const booking = await getDb().booking.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes,
      cancelledAt: parsed.data.status === "CANCELLED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ booking });
}
