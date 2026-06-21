"use client";

import { CalendarDays, LayoutDashboard, Scissors, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="min-h-screen bg-[#f4f1ed] text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden bg-ink text-white lg:flex lg:flex-col lg:border-r lg:border-white/10">
        <div className="px-5 py-6">
          <Link href="/admin" className="font-serif text-3xl">Alenalinery</Link>
          <p className="mt-1 text-xs text-white/60">Кабінет власниці</p>
        </div>
        <Separator className="bg-white/10" />
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
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-5 py-5 text-xs text-white/60">{displayName}</p>
      </aside>

      {/* Mobile top header */}
      <header className="flex items-center bg-ink px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="font-serif text-2xl">Alenalinery</Link>
      </header>

      <main className="p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-8 lg:p-10 lg:pb-10">
        {children}
      </main>

      {/* Mobile fixed bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-ink text-white lg:hidden"
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
                active ? "text-white" : "text-white/55 hover:text-white",
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
