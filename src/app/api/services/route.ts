import { NextResponse } from "next/server";

import { getPublicServiceCategories } from "@/lib/data/supabase";

export async function GET() {
  try {
    const categories = await getPublicServiceCategories();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Unable to load public services", error);
    return NextResponse.json({ message: "Не вдалося завантажити послуги." }, { status: 500 });
  }
}
