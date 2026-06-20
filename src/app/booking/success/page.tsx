import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatKyivDateTime } from "@/lib/timezone";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; startAt?: string }>;
}) {
  const { service, startAt } = await searchParams;
  const appointment = startAt ? new Date(startAt) : null;
  const dateLabel = appointment && !Number.isNaN(appointment.getTime()) ? formatKyivDateTime(appointment) : null;

  return (
    <>
      <SiteHeader />
      <main className="container section max-w-3xl">
        <CheckCircle2 className="text-accent" size={44} />
        <p className="eyebrow mt-6">Запит на запис створено</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">Дякуємо, до зустрічі.</h1>
        <p className="mt-5 max-w-xl leading-7 text-muted">Студія підтвердить ваш візит після перевірки деталей.</p>
        {service && dateLabel ? (
          <dl className="mt-8 divide-y divide-line border-y border-line">
            <div className="flex justify-between gap-4 py-4"><dt className="text-muted">Послуга</dt><dd className="text-right font-bold">{service}</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt className="text-muted">Дата і час</dt><dd className="text-right font-bold capitalize">{dateLabel}</dd></div>
          </dl>
        ) : null}
        <Link href="/" className="button-primary mt-9">На головну</Link>
      </main>
      <SiteFooter />
    </>
  );
}
