import { ArrowDownRight, ArrowUpRight, MapPin, Scissors } from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const servicePreview = [
  ["Фарбування", "Точний відтінок, м’які переходи, турбота про якість волосся."],
  ["Стрижки", "Форма, яку легко носити й укладати щодня."],
  ["Відновлення", "Кератин, ботокс і догляд, підібрані за станом волосся."],
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
          <div>
            <p className="eyebrow">Умань · студія волосся</p>
            <h1 className="display mt-5 max-w-2xl text-5xl leading-[.9] sm:text-6xl lg:text-7xl">
              Волосся, у якому впізнаєте себе.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-muted sm:text-lg">
              Персональна робота колористки й стилістки: складні фарбування, стрижки, відновлення та чесна
              консультація без зайвого.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/booking" className="button-primary">
                Записатися <ArrowUpRight size={17} />
              </Link>
              <Link href="/services" className="button-secondary">
                Переглянути послуги
              </Link>
            </div>
          </div>
          <div className="image-placeholder min-h-[25rem] sm:min-h-[31rem]">
            <span>Фото студії незабаром</span>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="container section grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
            <div>
              <p className="eyebrow">Напрями роботи</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">Результат починається з діалогу.</h2>
              <Link href="/services" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent">
                Усі послуги <ArrowDownRight size={17} />
              </Link>
            </div>
            <div className="divide-y divide-line">
              {servicePreview.map(([title, description], index) => (
                <article key={title} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0">
                  <span className="pt-1 text-sm font-bold text-accent">0{index + 1}</span>
                  <div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="container section grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="image-placeholder min-h-[20rem]">
            <span>Портрет майстрині незабаром</span>
          </div>
          <div>
            <p className="eyebrow">Про студію</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Спокійний простір для важливих змін.</h2>
            <p className="mt-6 max-w-xl leading-7 text-muted">
              Тут не поспішають із рішенням: спершу говоримо про ваш запит, звички й стан волосся. Потім обираємо
              техніку, яка буде гарною не лише в день процедури.
            </p>
          </div>
        </section>

        <section className="bg-ink py-14 text-white sm:py-20">
          <div className="container grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow text-[#e0a898]">Онлайн-запис</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">Оберіть послугу і зручний час.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
                Система покаже лише вільні слоти, а студія підтвердить запис після звернення.
              </p>
            </div>
            <Link href="/booking" className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-5 text-sm font-bold text-ink">
              Перейти до запису <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        <section className="container section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Портфоліо</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">Місце для реальних трансформацій.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted">Фото робіт будуть додані після підготовки галереї студії.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {["Колір", "Стрижка", "Догляд", "Результат"].map((label, index) => (
              <div key={label} className={`image-placeholder ${index === 0 ? "row-span-2 min-h-80" : "min-h-38"}`}>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="contacts" className="border-t border-line bg-surface">
          <div className="container section grid gap-8 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Контакти</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">До зустрічі в Умані.</h2>
              <p className="mt-5 flex items-center gap-2 text-muted">
                <MapPin size={18} /> Умань, Україна
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Актуальні контакти та посилання на соціальні мережі будуть додані перед запуском.
              </p>
            </div>
            <div className="border-l-2 border-accent pl-6 sm:pl-8">
              <Scissors className="text-accent" size={26} />
              <p className="mt-4 max-w-md text-lg leading-8">Потрібна порада до запису? Почніть із консультації колориста.</p>
              <Link href="/booking" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">
                Обрати консультацію <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
