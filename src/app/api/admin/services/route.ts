import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const categories = await getDb().serviceCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { services: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ categories });
}
