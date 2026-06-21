import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Clock3, UsersRound } from "lucide-react";

import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminBookings, getClientCount } from "@/lib/data/supabase";
import { BUSINESS_TIME_ZONE, getZonedDateTime } from "@/lib/timezone";

export default async function AdminDashboardPage() {
  const today = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const dayStart = getZonedDateTime(today, "00:00", BUSINESS_TIME_ZONE);
  const tomorrow = formatInTimeZone(addDays(new Date(`${today}T12:00:00.000Z`), 1), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const dayEnd = getZonedDateTime(tomorrow, "00:00", BUSINESS_TIME_ZONE);
  const [todayBookings, clientCount] = await Promise.all([
    getAdminBookings({ startAtGte: dayStart, startAtLt: dayEnd }),
    getClientCount(),
  ]);
  todayBookings.reverse();
  const activeCount = todayBookings.filter((booking) => !["CANCELLED", "EXPIRED", "NO_SHOW"].includes(booking.status)).length;

  return (
    <>
      <p className="eyebrow">Огляд</p>
      <h1 className="display mt-2 text-5xl">Сьогодні</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={CalendarDays} label="Записів сьогодні" value={todayBookings.length} />
        <Stat icon={Clock3} label="Активних" value={activeCount} />
        <Stat icon={UsersRound} label="Клієнток у базі" value={clientCount} />
      </div>
      <Card className="mt-10">
        <CardHeader className="border-b">
          <CardTitle>Записи на сьогодні</CardTitle>
          <CardAction className="text-sm text-muted-foreground">{todayBookings.length}</CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {todayBookings.length ? (
            <div className="divide-y divide-line">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="grid items-center gap-2 px-(--card-spacing) py-3 sm:grid-cols-[5rem_1fr_auto]">
                  <strong>{booking.startAt.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIME_ZONE })}</strong>
                  <span>
                    <span className="block font-medium">{booking.client.name}</span>
                    <span className="text-sm text-muted-foreground">{booking.service.name}</span>
                  </span>
                  <BookingStatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="px-(--card-spacing) py-6 text-sm text-muted-foreground">На сьогодні записів немає.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <Icon className="text-accent" size={19} />
        <p className="mt-5 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
