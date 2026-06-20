import { getDb } from "@/lib/db";

export default async function AdminServicesPage() {
  const categories = await getDb().serviceCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { services: { orderBy: { sortOrder: "asc" } } } });

  return (
    <>
      <p className="eyebrow">Послуги</p>
      <h1 className="display mt-2 text-5xl">Каталог послуг</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">У цьому MVP каталог доступний для перевірки структури, цін та тривалостей. Повний редактор послуг — наступне ізольоване операційне розширення.</p>
      <div className="mt-8 space-y-5">{categories.map((category) => <section key={category.id} className="border border-line bg-surface"><h2 className="border-b border-line px-5 py-4 font-bold">{category.name}</h2><div className="divide-y divide-line">{category.services.map((service) => <div key={service.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto]"><span><strong className="block">{service.name}</strong><span className="text-sm text-muted">{service.isActive ? "Активна" : "Прихована"}</span></span><span className="text-sm text-muted">{service.durationMinutes} хв</span><strong>{service.basePriceUah.toLocaleString("uk-UA")} ₴</strong></div>)}</div></section>)}</div>
    </>
  );
}
