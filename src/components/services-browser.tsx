"use client";

import { ArrowUpRight, Clock3, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePriceUah: number;
  durationMinutes: number;
  requiresConsultation: boolean;
  requiresDeposit: boolean;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  services: Service[];
};

export function ServicesBrowser() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    fetch("/api/services")
      .then(async (response) => {
        if (!response.ok) throw new Error("Services request failed");
        return response.json() as Promise<{ categories: Category[] }>;
      })
      .then((data) => {
        if (active) {
          setCategories(data.categories);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return <ServicesSkeleton />;
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="border-studio-danger/35 bg-studio-accent-soft text-studio-ink">
        <TriangleAlert />
        <AlertTitle>Не вдалося завантажити послуги</AlertTitle>
        <AlertDescription>Перевірте налаштування бази даних або спробуйте пізніше.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-14">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`category-${category.slug}`}>
          <div className="mb-0 flex flex-wrap items-end justify-between gap-5 border-b border-studio-border pb-5">
            <div>
              <h2 id={`category-${category.slug}`} className="display text-4xl sm:text-5xl">
                {category.name}
              </h2>
              {category.description ? (
                <p className="mt-2 max-w-xl text-sm leading-6 text-studio-muted">{category.description}</p>
              ) : null}
            </div>
            <Link href="/booking" className="inline-flex items-center gap-1 text-sm font-bold text-studio-accent transition hover:gap-2 hover:text-studio-accent-strong">
              Обрати час <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-studio-border">
            {category.services.map((service) => (
              <article key={service.id} className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">{service.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-studio-muted">{service.description}</p>
                  {service.requiresConsultation ? (
                    <Badge variant="outline" className="mt-3 border-studio-accent/40 text-studio-accent">
                      Потребує консультації
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <span className="inline-flex items-center gap-1 text-sm text-studio-muted">
                    <Clock3 size={15} /> {service.durationMinutes} хв
                  </span>
                  <strong className="whitespace-nowrap text-lg">від {service.basePriceUah.toLocaleString("uk-UA")} ₴</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ServicesSkeleton() {
  return (
    <div className="space-y-14" aria-busy="true">
      {[0, 1].map((category) => (
        <div key={category}>
          <div className="mb-0 border-b border-studio-border pb-5">
            <Skeleton className="h-9 w-56 bg-studio-surface-raised" />
          </div>
          <div className="divide-y divide-studio-border">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4 py-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44 bg-studio-surface-raised" />
                  <Skeleton className="h-4 w-72 bg-studio-surface-raised" />
                </div>
                <Skeleton className="h-6 w-24 bg-studio-surface-raised" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
