"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navigation = [
  { href: "/", label: "Головна" },
  { href: "/services", label: "Послуги" },
  { href: "/booking", label: "Онлайн-запис" },
  { href: "/#about", label: "Про студію" },
  { href: "/#contacts", label: "Контакти" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-line bg-background/95 backdrop-blur">
      <div className="container flex min-h-18 items-center justify-between gap-6 py-4">
        <Link href="/" className="font-serif text-3xl font-semibold tracking-tight" aria-label="Alenalinery, головна">
          Alenalinery
        </Link>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Основна навігація">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-muted transition hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/booking" className="button-primary hidden sm:inline-flex">
          Записатися
        </Link>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
          aria-label={isOpen ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {isOpen ? (
        <nav className="border-t border-line bg-surface lg:hidden" aria-label="Мобільна навігація">
          <div className="container grid py-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-line py-3 text-sm font-semibold"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/booking" className="button-primary mt-4" onClick={() => setIsOpen(false)}>
              Записатися
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
