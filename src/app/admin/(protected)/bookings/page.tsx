import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAdminBookings } from "@/lib/data/supabase";
import { BUSINESS_TIME_ZONE } from "@/lib/timezone";

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookings({ limit: 100 });

  return (
    <>
      <p className="eyebrow">Записи</p>
      <h1 className="display mt-2 text-5xl">Календар готовий до розвитку.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Табличний список є надійною базою для календарного представлення та операційних фільтрів наступної ітерації.</p>
      <Card className="mt-8">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-(--card-spacing)">Дата</TableHead>
                <TableHead>Клієнтка</TableHead>
                <TableHead>Послуга</TableHead>
                <TableHead className="pr-(--card-spacing) text-right">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="pl-(--card-spacing) whitespace-nowrap">
                    {booking.startAt.toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short", timeZone: BUSINESS_TIME_ZONE })}
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium">{booking.client.name}</span>
                    <span className="text-muted-foreground">{booking.client.phone}</span>
                  </TableCell>
                  <TableCell>{booking.service.name}</TableCell>
                  <TableCell className="pr-(--card-spacing) text-right">
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!bookings.length ? <p className="px-(--card-spacing) py-8 text-sm text-muted-foreground">Записів ще немає.</p> : null}
        </CardContent>
      </Card>
    </>
  );
}
