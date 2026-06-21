import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
        <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Студія підтвердить ваш візит після перевірки деталей.</p>
        {service && dateLabel ? (
          <Card className="mt-8 max-w-xl">
            <CardContent className="grid gap-0">
              <div className="flex justify-between gap-4 py-3">
                <span className="text-muted-foreground">Послуга</span>
                <strong className="text-right">{service}</strong>
              </div>
              <Separator />
              <div className="flex justify-between gap-4 py-3">
                <span className="text-muted-foreground">Дата і час</span>
                <strong className="text-right capitalize">{dateLabel}</strong>
              </div>
            </CardContent>
          </Card>
        ) : null}
        <Link href="/" className="button-primary mt-9">На головну</Link>
      </main>
      <SiteFooter />
    </>
  );
}
