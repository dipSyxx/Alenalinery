import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ServicesBrowser } from "@/components/services-browser";

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main className="container section">
        <p className="eyebrow">Послуги</p>
        <h1 className="display mt-3 max-w-2xl text-5xl sm:text-6xl">Послуги, адаптовані до вашого волосся.</h1>
        <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
          Вартість і тривалість залежать від довжини, густоти та стану волосся. Остаточний план складних робіт
          погоджуємо на консультації.
        </p>
        <div className="mt-12">
          <ServicesBrowser />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
