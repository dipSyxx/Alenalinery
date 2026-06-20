import { NextResponse } from "next/server";

import { getAdminProfileForApi } from "@/lib/auth/admin";
import { getDb } from "@/lib/db";
import { scheduleBlockCreateSchema, workingHoursUpdateSchema } from "@/lib/validation/admin";

export async function GET() {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const [workingHours, scheduleBlocks] = await Promise.all([
    getDb().workingHours.findMany({ orderBy: { weekday: "asc" } }),
    getDb().scheduleBlock.findMany({ where: { endAt: { gte: new Date() } }, orderBy: { startAt: "asc" } }),
  ]);

  return NextResponse.json({ workingHours, scheduleBlocks });
}

export async function PATCH(request: Request) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const parsed = workingHoursUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success || parsed.data.startTime >= parsed.data.endTime) {
    return NextResponse.json({ message: "Перевірте робочі години." }, { status: 400 });
  }

  const { id, startTime, endTime, isWorkingDay } = parsed.data;
  const workingHours = await getDb().workingHours.update({
    where: { id },
    data: { startTime, endTime, isWorkingDay },
  });

  return NextResponse.json({ workingHours });
}

export async function POST(request: Request) {
  if (!(await getAdminProfileForApi())) {
    return NextResponse.json({ message: "Потрібна авторизація." }, { status: 401 });
  }

  const parsed = scheduleBlockCreateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Перевірте блокування часу." }, { status: 400 });
  }

  const scheduleBlockData = {
    startAt: parsed.data.startAt,
    endAt: parsed.data.endAt,
    reason: parsed.data.reason,
  };
  const scheduleBlock = await getDb().scheduleBlock.create({ data: scheduleBlockData });
  return NextResponse.json({ scheduleBlock }, { status: 201 });
}
