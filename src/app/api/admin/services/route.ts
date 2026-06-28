import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { createAdminService, getAdminServiceCategories } from "@/lib/data/supabase";
import { adminServiceCreateSchema } from "@/lib/validation/admin";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const categories = await getAdminServiceCategories();

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const parsed = adminServiceCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Перевірте дані послуги." }, { status: 400 });
  }

  try {
    const service = await createAdminService(parsed.data);
    return NextResponse.json({ service }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Не вдалося створити послугу." }, { status: 500 });
  }
}
