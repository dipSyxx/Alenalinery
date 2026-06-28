import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { PublicPageFrame } from "@/components/public-page-frame";
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
      <SiteHeader variant="dark" />
      <PublicPageFrame
        eyebrow="Запит на запис створено"
        title="Дякуємо, до зустрічі."
        description="Студія підтвердить ваш візит після перевірки деталей."
      >
        <div className="landing-container py-12 sm:py-16">
          <CheckCircle2 className="text-studio-accent" size={44} />
          {service && dateLabel ? (
            <Card className="admin-panel mt-7 max-w-xl">
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
          <Link href="/" className="button-primary mt-9">
            На головну
          </Link>
        </div>
      </PublicPageFrame>
      <SiteFooter variant="dark" />
    </>
  );
}
