import Link from "next/link";

type SiteFooterProps = {
  variant?: "light" | "dark";
};

export function SiteFooter({ variant = "light" }: SiteFooterProps) {
  const isDark = variant === "dark";
  const mutedTextClass = isDark ? "text-studio-surface/55" : "text-muted-foreground";
  const linkClass = isDark ? "text-studio-surface/70 transition hover:text-studio-surface" : "transition hover:text-ink";

  return (
    <footer className={isDark ? "border-t border-studio-surface/10 bg-studio-canvas py-8 text-studio-surface" : "border-t border-line py-8"}>
      <div className={"container flex flex-col justify-between gap-4 text-sm " + mutedTextClass + " sm:flex-row sm:items-center"}>
        <p>© {new Date().getFullYear()} Alenalinery. Студія волосся в Умані.</p>
        <div className="flex gap-4">
          <Link href="/services" className={linkClass}>
            Послуги
          </Link>
          <Link href="/booking" className={linkClass}>
            Онлайн-запис
          </Link>
          <Link href="/admin/login" className={linkClass}>
            Вхід для власниці
          </Link>
        </div>
      </div>
    </footer>
  );
}
