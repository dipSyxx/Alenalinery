"use client";

import { CalendarDays, LayoutDashboard, Menu, Scissors, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Огляд", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Записи", icon: CalendarDays },
  { href: "/admin/services", label: "Послуги", icon: Scissors },
  { href: "/admin/schedule", label: "Графік", icon: Settings2 },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinks({ pathname, inSheet = false }: { pathname: string; inSheet?: boolean }) {
  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const active = isActive(pathname, link.href);
        const linkEl = (
          <Link
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
        return inSheet ? (
          <SheetClose asChild key={link.href}>
            {linkEl}
          </SheetClose>
        ) : (
          <div key={link.href}>{linkEl}</div>
        );
      })}
    </>
  );
}

export function AdminShell({ children, displayName }: { children: React.ReactNode; displayName: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f4f1ed] text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-ink text-white lg:flex lg:flex-col lg:border-r lg:border-white/10">
        <div className="px-5 py-6">
          <Link href="/admin" className="font-serif text-3xl">Alenalinery</Link>
          <p className="mt-1 text-xs text-white/60">Кабінет власниці</p>
        </div>
        <Separator className="bg-white/10" />
        <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Адмін-навігація">
          <NavLinks pathname={pathname} />
        </nav>
        <p className="mt-auto px-5 py-5 text-xs text-white/60">{displayName}</p>
      </aside>

      <header className="flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="font-serif text-2xl">Alenalinery</Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="size-10 text-white hover:bg-white/10 hover:text-white" aria-label="Відкрити меню">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-white/10 bg-ink p-0 text-white">
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl text-white">Alenalinery</SheetTitle>
              <SheetDescription className="text-white/60">{displayName}</SheetDescription>
            </SheetHeader>
            <Separator className="bg-white/10" />
            <nav className="flex flex-col gap-1 px-3 py-2" aria-label="Адмін-навігація">
              <NavLinks pathname={pathname} inSheet />
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
