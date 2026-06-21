import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { getAdminBookings } from "@/lib/data/supabase";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const bookings = await getAdminBookings({ limit: 100 });

  return NextResponse.json({ bookings });
}
