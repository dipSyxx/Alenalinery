"use client";

import { CalendarDays, LayoutDashboard, LogOut, Scissors, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Огляд", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Записи", icon: CalendarDays },
  { href: "/admin/schedule", label: "Графік", icon: Settings2 },
  { href: "/admin/services", label: "Послуги", icon: Scissors },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children, displayName }: { children: React.ReactNode; displayName: string }) {
  const pathname = usePathname();

  return (
    <div className="admin-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden bg-studio-canvas-raised text-studio-surface lg:flex lg:flex-col lg:border-r lg:border-studio-surface/10">
        <div className="px-5 py-6">
          <Link href="/admin" className="font-serif text-3xl">Alenalinery</Link>
          <p className="mt-1 text-xs text-studio-surface/60">Кабінет власниці</p>
        </div>
        <Separator className="bg-studio-surface/10" />
        <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Адмін-навігація">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 px-3 text-sm font-semibold transition",
                  active
                    ? "bg-studio-surface/10 text-studio-surface"
                    : "text-studio-surface/65 hover:bg-studio-surface/5 hover:text-studio-surface",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-5 py-5">
          <p className="text-xs text-studio-surface/60">{displayName}</p>
          <form action="/api/admin/logout" method="post" className="mt-3">
            <Button className="h-9 w-full justify-start text-studio-surface/75 hover:bg-studio-surface/10 hover:text-studio-surface" variant="ghost" type="submit">
              <LogOut className="size-4" /> Вийти
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="flex items-center justify-between bg-studio-canvas-raised px-4 py-3 text-studio-surface lg:hidden">
        <Link href="/admin" className="font-serif text-2xl">Alenalinery</Link>
        <form action="/api/admin/logout" method="post">
          <Button
            className="text-studio-surface/75 hover:bg-studio-surface/10 hover:text-studio-surface"
            variant="ghost"
            size="icon"
            type="submit"
            aria-label="Вийти з адмінки"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </header>

      <main className="p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-8 lg:p-10 lg:pb-10">
        {children}
      </main>

      {/* Mobile fixed bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-studio-surface/10 bg-studio-canvas-raised text-studio-surface lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Адмін-навігація"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition",
                "min-h-[44px]",
                active ? "text-studio-surface" : "text-studio-surface/55 hover:text-studio-surface",
              )}
            >
              <Icon className="size-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
