import { CalendarDays, LayoutDashboard, Scissors, Settings2 } from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/admin", label: "Огляд", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Записи", icon: CalendarDays },
  { href: "/admin/services", label: "Послуги", icon: Scissors },
  { href: "/admin/schedule", label: "Графік", icon: Settings2 },
];

export function AdminShell({ children, displayName }: { children: React.ReactNode; displayName: string }) {
  return (
    <div className="min-h-screen bg-[#f4f1ed] text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-ink text-white lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/admin" className="font-serif text-3xl">Alenalinery</Link>
          <p className="mt-1 hidden text-xs text-white/60 lg:block">Кабінет власниці</p>
          <p className="text-xs text-white/60 lg:mt-8">{displayName}</p>
        </div>
        <nav className="flex overflow-x-auto border-t border-white/10 px-3 py-2 lg:block lg:border-t-0 lg:px-4 lg:py-0" aria-label="Адмін-навігація">
          {links.map((link) => {
            const Icon = link.icon;
            return <Link key={link.href} href={link.href} className="inline-flex min-h-10 shrink-0 items-center gap-2 px-3 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white lg:flex lg:mb-1"><Icon size={16} />{link.label}</Link>;
          })}
        </nav>
      </aside>
      <main className="p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
