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
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Не вдалося завантажити послуги</AlertTitle>
        <AlertDescription>
          Перевірте налаштування бази даних або спробуйте пізніше.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`category-${category.slug}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 id={`category-${category.slug}`} className="display text-4xl sm:text-5xl">
                {category.name}
              </h2>
              {category.description ? <p className="mt-2 max-w-xl text-sm text-muted-foreground">{category.description}</p> : null}
            </div>
            <Link href="/booking" className="text-sm font-bold text-accent hover:text-accent-strong">
              Обрати час <ArrowUpRight className="inline" size={16} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {category.services.map((service) => (
              <article key={service.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="text-lg font-bold">{service.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{service.description}</p>
                  {service.requiresConsultation ? (
                    <Badge variant="outline" className="mt-2 border-accent/40 text-accent">
                      Потребує консультації
                    </Badge>
                  ) : null}
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
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
    <div className="space-y-12">
      {[0, 1].map((category) => (
        <div key={category}>
          <div className="mb-5 border-b border-line pb-4">
            <Skeleton className="h-9 w-56" />
          </div>
          <div className="divide-y divide-line">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4 py-5">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
