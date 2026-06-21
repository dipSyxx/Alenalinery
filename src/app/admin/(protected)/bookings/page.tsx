import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { AdminBookingsWorkspace, type AdminBookingView } from "@/components/admin-bookings-workspace";
import { getAdminBookings } from "@/lib/data/supabase";
import { BUSINESS_TIME_ZONE, getZonedDateTime } from "@/lib/timezone";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const today = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");
  const selectedDate = rawDate && DATE_PATTERN.test(rawDate) ? rawDate : today;

  const dayStart = getZonedDateTime(selectedDate, "00:00", BUSINESS_TIME_ZONE);
  const nextDay = formatInTimeZone(
    addDays(new Date(`${selectedDate}T12:00:00.000Z`), 1),
    BUSINESS_TIME_ZONE,
    "yyyy-MM-dd",
  );
  const dayEnd = getZonedDateTime(nextDay, "00:00", BUSINESS_TIME_ZONE);

  const records = await getAdminBookings({ startAtGte: dayStart, startAtLt: dayEnd, ascending: true });

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

  return (
    <>
      <p className="eyebrow">Записи</p>
      <div className="mt-4">
        <AdminBookingsWorkspace
          bookings={bookings}
          selectedDate={selectedDate}
          showManualCreate
        />
      </div>
    </>
  );
}
