import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const bookings = await getDb().booking.findMany({
    take: 100,
    orderBy: { startAt: "desc" },
    include: { client: true, service: true },
  });

  return NextResponse.json({ bookings });
}
