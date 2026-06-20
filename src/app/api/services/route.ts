import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const categories = await getDb().serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            basePriceUah: true,
            durationMinutes: true,
            requiresConsultation: true,
            requiresDeposit: true,
          },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Unable to load public services", error);
    return NextResponse.json({ message: "Не вдалося завантажити послуги." }, { status: 500 });
  }
}
