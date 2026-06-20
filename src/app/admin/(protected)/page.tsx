import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Clock3, UsersRound } from "lucide-react";

import { getDb } from "@/lib/db";
import { BUSINESS_TIME_ZONE, getZonedDateTime } from "@/lib/timezone";

export default async function AdminDashboardPage() {
  const today = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const dayStart = getZonedDateTime(today, "00:00", BUSINESS_TIME_ZONE);
  const tomorrow = formatInTimeZone(addDays(new Date(`${today}T12:00:00.000Z`), 1), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const dayEnd = getZonedDateTime(tomorrow, "00:00", BUSINESS_TIME_ZONE);
  const db = getDb();
  const [todayBookings, clientCount] = await Promise.all([
    db.booking.findMany({
      where: { startAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startAt: "asc" },
      include: { client: { select: { name: true, phone: true } }, service: { select: { name: true } } },
    }),
    db.client.count(),
  ]);
  const activeCount = todayBookings.filter((booking) => !["CANCELLED", "EXPIRED", "NO_SHOW"].includes(booking.status)).length;

  return (
    <>
      <p className="eyebrow">Огляд</p>
      <h1 className="display mt-2 text-5xl">Сьогодні</h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat icon={CalendarDays} label="Записів сьогодні" value={todayBookings.length} />
        <Stat icon={Clock3} label="Активних" value={activeCount} />
        <Stat icon={UsersRound} label="Клієнток у базі" value={clientCount} />
      </div>
      <section className="mt-10 border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-bold">Записи на сьогодні</h2><span className="text-sm text-muted">{todayBookings.length}</span></div>
        {todayBookings.length ? <div className="divide-y divide-line">{todayBookings.map((booking) => <div key={booking.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[5rem_1fr_auto]"><strong>{booking.startAt.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIME_ZONE })}</strong><span><span className="block font-bold">{booking.client.name}</span><span className="text-sm text-muted">{booking.service.name}</span></span><span className="text-sm text-muted">{booking.status}</span></div>)}</div> : <p className="px-5 py-8 text-sm text-muted">На сьогодні записів немає.</p>}
      </section>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: number }) {
  return <div className="border border-line bg-surface p-5"><Icon className="text-accent" size={19} /><p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-muted">{label}</p></div>;
}
