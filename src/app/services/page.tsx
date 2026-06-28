import { PublicPageFrame } from "@/components/public-page-frame";
import { ServicesBrowser } from "@/components/services-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ServicesPage() {
  return (
    <>
      <SiteHeader variant="dark" />
      <PublicPageFrame
        eyebrow="Послуги"
        title="Послуги, адаптовані до вашого волосся."
        description="Вартість і тривалість залежать від довжини, густоти та стану волосся. Остаточний план складних робіт погоджуємо на консультації."
      >
        <div className="landing-container py-14 sm:py-20">
          <ServicesBrowser />
        </div>
      </PublicPageFrame>
      <SiteFooter variant="dark" />
    </>
  );
}
