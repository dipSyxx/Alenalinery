import { Menu } from "lucide-react";
import Link from "next/link";

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

const navigation = [
  { href: "/", label: "Головна" },
  { href: "/services", label: "Послуги" },
  { href: "/booking", label: "Онлайн-запис" },
  { href: "/#about", label: "Про студію" },
  { href: "/#contacts", label: "Контакти" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-background/95 backdrop-blur">
      <div className="container flex min-h-18 items-center justify-between gap-6 py-4">
        <Link href="/" className="font-serif text-3xl font-semibold tracking-tight" aria-label="Alenalinery, головна">
          Alenalinery
        </Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Основна навігація">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-muted-foreground transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/booking" className="button-primary hidden sm:inline-flex">
          Записатися
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="size-10 lg:hidden" aria-label="Відкрити меню">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs gap-0">
            <SheetHeader>
              <SheetTitle className="font-serif text-2xl">Alenalinery</SheetTitle>
              <SheetDescription className="sr-only">Навігація сайту</SheetDescription>
            </SheetHeader>
            <Separator />
            <nav className="flex flex-col px-4 pt-2" aria-label="Мобільна навігація">
              {navigation.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href} className="border-b border-line py-3 text-sm font-semibold">
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link href="/booking" className="button-primary mt-5">
                  Записатися
                </Link>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
