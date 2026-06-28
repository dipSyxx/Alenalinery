"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
  { href: "/#about", label: "Підхід" },
  { href: "/#contacts", label: "Контакти" },
];

type SiteHeaderProps = {
  variant?: "light" | "dark";
};

const headerVariants = {
  dark: {
    top: {
      backgroundColor: "rgba(9, 6, 6, 1)",
      borderColor: "rgba(255, 255, 255, 0.10)",
      boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      backdropFilter: "blur(0px)",
    },
    scrolled: {
      backgroundColor: "rgba(9, 6, 6, 0.82)",
      borderColor: "rgba(255, 255, 255, 0.18)",
      boxShadow: "0 18px 48px rgba(0, 0, 0, 0.28)",
      backdropFilter: "blur(18px)",
    },
  },
  light: {
    top: {
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "rgba(222, 213, 214, 1)",
      boxShadow: "0 0 0 rgba(26, 21, 22, 0)",
      backdropFilter: "blur(10px)",
    },
    scrolled: {
      backgroundColor: "rgba(255, 255, 255, 0.84)",
      borderColor: "rgba(139, 16, 26, 0.18)",
      boxShadow: "0 14px 36px rgba(26, 21, 22, 0.10)",
      backdropFilter: "blur(18px)",
    },
  },
};

export function SiteHeader({ variant = "light" }: SiteHeaderProps) {
  const isDark = variant === "dark";
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const navigationClass = isDark
    ? "text-sm font-semibold text-studio-surface/70 transition hover:text-studio-surface"
    : "text-sm font-semibold text-muted-foreground transition hover:text-ink";

  useMotionValueEvent(scrollY, "change", (latest) => {
    const nextScrolled = latest > 12;
    setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
  });

  return (
    <motion.header
      className={isDark ? "sticky top-[-1px] z-40 border-b text-studio-surface" : "sticky top-[-1px] z-40 border-b text-ink"}
      initial={false}
      animate={scrolled ? "scrolled" : "top"}
      variants={headerVariants[variant]}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="container flex min-h-16 items-center justify-between gap-4 sm:gap-6"
        animate={{ paddingTop: scrolled ? 10 : 16, paddingBottom: scrolled ? 10 : 16 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ scale: scrolled ? 0.96 : 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="origin-left"
        >
          <Link href="/" className={isDark ? "text-2xl font-semibold tracking-tight text-studio-surface sm:text-3xl" : "font-serif text-3xl font-semibold tracking-tight"} aria-label="Alenalinery, головна">
            Alenalinery
          </Link>
        </motion.div>
        <nav className="hidden items-center gap-5 lg:flex" aria-label="Основна навігація">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={navigationClass}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/booking"
          className={
            isDark
              ? "hidden min-h-10 items-center justify-center rounded-full border border-studio-surface/60 px-5 text-sm font-bold text-studio-surface transition hover:border-studio-surface hover:bg-studio-surface hover:text-studio-canvas sm:inline-flex"
              : "button-primary hidden sm:inline-flex"
          }
        >
          Записатися
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className={isDark ? "size-10 text-studio-surface hover:bg-studio-surface/10 hover:text-studio-surface lg:hidden" : "size-10 lg:hidden"} aria-label="Відкрити меню">
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
      </motion.div>
    </motion.header>
  );
}
