import { BookingFlow } from "@/components/booking-flow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function BookingPage() {
  return (
    <>
      <SiteHeader />
      <main className="container section">
        <p className="eyebrow">Онлайн-запис</p>
        <h1 className="display mt-3 max-w-2xl text-5xl sm:text-6xl">Час для турботи про себе.</h1>
        <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">
          Оберіть послугу, дату й зручний час. Ми створимо попередній запис та зв’яжемося для підтвердження.
        </p>
        <div className="mt-12">
          <BookingFlow />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
