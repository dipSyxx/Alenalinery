import { getDb } from "@/lib/db";
import { BUSINESS_TIME_ZONE } from "@/lib/timezone";

export default async function AdminBookingsPage() {
  const bookings = await getDb().booking.findMany({
    take: 100,
    orderBy: { startAt: "desc" },
    include: { client: { select: { name: true, phone: true } }, service: { select: { name: true } } },
  });

  return (
    <>
      <p className="eyebrow">Записи</p>
      <h1 className="display mt-2 text-5xl">Календар готовий до розвитку.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Табличний список є надійною базою для календарного представлення та операційних фільтрів наступної ітерації.</p>
      <section className="mt-8 overflow-x-auto border border-line bg-surface">
        <table className="min-w-180 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Дата</th><th className="px-5 py-4">Клієнтка</th><th className="px-5 py-4">Послуга</th><th className="px-5 py-4">Статус</th></tr></thead>
          <tbody className="divide-y divide-line">{bookings.map((booking) => <tr key={booking.id}><td className="px-5 py-4 whitespace-nowrap">{booking.startAt.toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short", timeZone: BUSINESS_TIME_ZONE })}</td><td className="px-5 py-4"><strong className="block">{booking.client.name}</strong><span className="text-muted">{booking.client.phone}</span></td><td className="px-5 py-4">{booking.service.name}</td><td className="px-5 py-4">{booking.status}</td></tr>)}</tbody>
        </table>
        {!bookings.length ? <p className="px-5 py-8 text-sm text-muted">Записів ще немає.</p> : null}
      </section>
    </>
  );
}
