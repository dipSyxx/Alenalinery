import { BookingFlow } from "@/components/booking-flow";
import { PublicPageFrame } from "@/components/public-page-frame";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function BookingPage() {
  return (
    <>
      <SiteHeader variant="dark" />
      <PublicPageFrame
        eyebrow="Онлайн-запис"
        title="Час для турботи про себе."
        description="Оберіть послугу, дату й зручний час. Ми створимо попередній запис та зв’яжемося для підтвердження."
      >
        <div className="landing-container py-10 sm:py-16">
          <BookingFlow />
        </div>
      </PublicPageFrame>
      <SiteFooter variant="dark" />
    </>
  );
}
