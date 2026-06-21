import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { getAdminServiceCategories } from "@/lib/data/supabase";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const categories = await getAdminServiceCategories();

  return NextResponse.json({ categories });
}
