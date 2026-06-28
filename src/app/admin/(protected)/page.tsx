import { addDays } from "date-fns";
import { uk } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { Clock3, UsersRound } from "lucide-react";

import { AdminBookingsWorkspace, type AdminBookingView } from "@/components/admin-bookings-workspace";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminBookings, getClientCount } from "@/lib/data/supabase";
import { DATE_KEY_PATTERN, formatDateKey } from "@/lib/date-key";
import { BUSINESS_TIME_ZONE, getZonedDateTime } from "@/lib/timezone";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const today = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const selectedDate = rawDate && DATE_KEY_PATTERN.test(rawDate) ? rawDate : today;
  const dayStart = getZonedDateTime(selectedDate, "00:00", BUSINESS_TIME_ZONE);
  const tomorrow = formatInTimeZone(
    addDays(new Date(`${selectedDate}T12:00:00.000Z`), 1),
    BUSINESS_TIME_ZONE,
    "yyyy-MM-dd",
  );
  const dayEnd = getZonedDateTime(tomorrow, "00:00", BUSINESS_TIME_ZONE);

  const [records, clientCount] = await Promise.all([
    getAdminBookings({ startAtGte: dayStart, startAtLt: dayEnd, ascending: true }),
    getClientCount(),
  ]);

  const activeCount = records.filter(
    (b) => !["CANCELLED", "EXPIRED", "NO_SHOW"].includes(b.status),
  ).length;

  const bookings: AdminBookingView[] = records.map((b) => ({
    id: b.id,
    startAtISO: b.startAt.toISOString(),
    endAtISO: b.endAt.toISOString(),
    status: b.status,
    source: b.source,
    totalPriceUah: b.totalPriceUah,
    clientComment: b.clientComment,
    adminNotes: b.adminNotes,
    cancelledAtISO: b.cancelledAt ? b.cancelledAt.toISOString() : null,
    client: b.client,
    service: b.service,
  }));
  const pageTitle = selectedDate === today ? "Сьогодні" : formatDateKey(selectedDate, "d MMMM yyyy", { locale: uk });

  return (
    <>
      <p className="eyebrow">Огляд</p>
      <h1 className="admin-page-title mt-2 text-5xl capitalize">{pageTitle}</h1>
      <div className="mt-8 grid grid-cols-2 gap-4">
        <StatCard icon={Clock3} label="Активних" value={activeCount} />
        <StatCard icon={UsersRound} label="Клієнток у базі" value={clientCount} />
      </div>
      <div className="mt-8">
        <AdminBookingsWorkspace
          bookings={bookings}
          selectedDate={selectedDate}
          showManualCreate
        />
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: number }) {
  return (
    <Card className="admin-panel">
      <CardContent>
        <Icon className="text-studio-accent" size={19} />
        <p className="mt-5 text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm text-studio-muted">{label}</p>
      </CardContent>
    </Card>
  );
}
