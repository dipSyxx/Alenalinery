import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8">
      <div className="container flex flex-col justify-between gap-4 text-sm text-muted sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} Alenalinery. Студія волосся в Умані.</p>
        <div className="flex gap-4">
          <Link href="/services" className="hover:text-ink">
            Послуги
          </Link>
          <Link href="/booking" className="hover:text-ink">
            Онлайн-запис
          </Link>
          <Link href="/admin/login" className="hover:text-ink">
            Вхід для власниці
          </Link>
        </div>
      </div>
    </footer>
  );
}
