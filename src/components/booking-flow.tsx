"use client";

import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, ArrowRight, CalendarDays, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type Service = {
  id: string;
  name: string;
  description: string;
  basePriceUah: number;
  durationMinutes: number;
  requiresConsultation: boolean;
  requiresDeposit: boolean;
};

type Category = {
  id: string;
  name: string;
  services: Service[];
};

type BookingDetails = {
  name: string;
  phone: string;
  instagram?: string;
  telegram?: string;
  clientComment?: string;
};

const KYIV_TIME_ZONE = "Europe/Kyiv";

export function BookingFlow() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [servicesStatus, setServicesStatus] = useState<"loading" | "ready" | "error">("loading");
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<BookingDetails>();

  const service = useMemo(
    () => categories.flatMap((category) => category.services).find((item) => item.id === serviceId),
    [categories, serviceId],
  );
  const minimumDate = useMemo(() => formatInTimeZone(new Date(), KYIV_TIME_ZONE, "yyyy-MM-dd"), []);

  useEffect(() => {
    let active = true;
    fetch("/api/services")
      .then(async (response) => {
        if (!response.ok) throw new Error("Services request failed");
        return response.json() as Promise<{ categories: Category[] }>;
      })
      .then((data) => {
        if (active) {
          setCategories(data.categories);
          setServicesStatus("ready");
        }
      })
      .catch(() => {
        if (active) setServicesStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!serviceId || !date) return;

    const controller = new AbortController();

    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${date}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as { slots?: string[]; message?: string };
        if (!response.ok) throw new Error(body.message ?? "Availability request failed");
        return body;
      })
      .then((data) => {
        setSlots(data.slots ?? []);
        setAvailabilityStatus("ready");
      })
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setAvailabilityStatus("error");
          setSlots([]);
        }
      });

    return () => controller.abort();
  }, [serviceId, date]);

  function selectService(id: string) {
    setServiceId(id);
    setDate("");
    setSelectedSlot("");
    setStep(2);
  }

  function changeDate(value: string) {
    setDate(value);
    setSelectedSlot("");
    setSlots([]);
    setAvailabilityStatus(value ? "loading" : "idle");
  }

  function submitDetails(values: BookingDetails) {
    setDetails(values);
    setSubmitError("");
    setStep(4);
  }

  async function confirmBooking() {
    if (!service || !selectedSlot || !details) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          date,
          time: formatInTimeZone(new Date(selectedSlot), KYIV_TIME_ZONE, "HH:mm"),
          ...details,
        }),
      });
      const body = (await response.json()) as { booking?: { id: string }; message?: string };

      if (!response.ok || !body.booking) {
        throw new Error(body.message ?? "Не вдалося створити запис.");
      }

      const query = new URLSearchParams({
        bookingId: body.booking.id,
        service: service.name,
        startAt: selectedSlot,
      });
      router.push(`/booking/success?${query.toString()}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не вдалося створити запис.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_1fr]">
      <ol className="grid grid-cols-4 gap-2 border-b border-line pb-5 lg:grid-cols-1 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
        {["Послуга", "Дата і час", "Контакти", "Підтвердження"].map((label, index) => {
          const current = index + 1 === step;
          const complete = index + 1 < step;
          return (
            <li key={label} className={`text-xs font-bold ${current ? "text-accent" : complete ? "text-ink" : "text-muted"}`}>
              <span className="mr-1 inline-flex h-5 w-5 items-center justify-center border border-current text-[.65rem]">
                {complete ? <Check size={12} /> : index + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </li>
          );
        })}
      </ol>

      <section aria-live="polite">
        {step === 1 ? (
          <ServiceStep
            categories={categories}
            selectedServiceId={serviceId}
            status={servicesStatus}
            onSelect={selectService}
          />
        ) : null}
        {step === 2 && service ? (
          <TimeStep
            service={service}
            date={date}
            minimumDate={minimumDate}
            onDateChange={changeDate}
            slots={date ? slots : []}
            selectedSlot={selectedSlot}
            status={date ? availabilityStatus : "idle"}
            onSelectSlot={setSelectedSlot}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        ) : null}
        {step === 3 && service && selectedSlot ? (
          <DetailsStep form={form} onBack={() => setStep(2)} onSubmit={submitDetails} />
        ) : null}
        {step === 4 && service && selectedSlot && details ? (
          <ReviewStep
            service={service}
            slot={selectedSlot}
            details={details}
            error={submitError}
            isSubmitting={isSubmitting}
            onBack={() => setStep(3)}
            onConfirm={confirmBooking}
          />
        ) : null}
      </section>
    </div>
  );
}

function ServiceStep({
  categories,
  selectedServiceId,
  status,
  onSelect,
}: {
  categories: Category[];
  selectedServiceId: string;
  status: "loading" | "ready" | "error";
  onSelect: (id: string) => void;
}) {
  if (status === "loading") return <p className="py-12 text-muted">Завантажуємо послуги…</p>;
  if (status === "error") return <p role="alert" className="border-l-2 border-accent py-2 pl-4 text-muted">Не вдалося завантажити послуги.</p>;

  return (
    <div>
      <p className="eyebrow">Крок 1</p>
      <h2 className="display mt-2 text-4xl">Оберіть послугу</h2>
      <div className="mt-7 space-y-8">
        {categories.map((category) => (
          <fieldset key={category.id}>
            <legend className="mb-3 text-sm font-bold">{category.name}</legend>
            <div className="grid gap-2">
              {category.services.map((item) => {
                const selected = item.id === selectedServiceId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`grid gap-2 border p-4 text-left transition sm:grid-cols-[1fr_auto] sm:items-center ${selected ? "border-accent bg-[#f4ece8]" : "border-line bg-surface hover:border-[#bea89e]"}`}
                    aria-pressed={selected}
                    onClick={() => onSelect(item.id)}
                  >
                    <span>
                      <span className="block font-bold">{item.name}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted">{item.description}</span>
                    </span>
                    <span className="text-sm font-bold">від {item.basePriceUah.toLocaleString("uk-UA")} ₴ · {item.durationMinutes} хв</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function TimeStep({
  service,
  date,
  minimumDate,
  onDateChange,
  slots,
  selectedSlot,
  status,
  onSelectSlot,
  onBack,
  onContinue,
}: {
  service: Service;
  date: string;
  minimumDate: string;
  onDateChange: (date: string) => void;
  slots: string[];
  selectedSlot: string;
  status: "idle" | "loading" | "ready" | "error";
  onSelectSlot: (slot: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <p className="eyebrow">Крок 2</p>
      <h2 className="display mt-2 text-4xl">Дата та час</h2>
      <p className="mt-3 text-sm text-muted">{service.name} · від {service.basePriceUah.toLocaleString("uk-UA")} ₴</p>
      <div className="mt-7 max-w-xs">
        <label className="field-label" htmlFor="booking-date">Оберіть дату</label>
        <input
          id="booking-date"
          className="field"
          type="date"
          min={minimumDate}
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>
      {status === "loading" ? <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted"><LoaderCircle className="animate-spin" size={16} /> Шукаємо вільний час…</p> : null}
      {status === "error" ? <p role="alert" className="mt-6 border-l-2 border-accent py-2 pl-4 text-sm text-muted">Не вдалося завантажити вільний час. Спробуйте ще раз.</p> : null}
      {status === "ready" && slots.length === 0 ? <p className="mt-6 text-sm text-muted">На цю дату немає вільних слотів. Оберіть інший день.</p> : null}
      {status === "ready" && slots.length > 0 ? (
        <fieldset className="mt-7">
          <legend className="mb-3 text-sm font-bold">Вільний час</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const selected = slot === selectedSlot;
              return (
                <button
                  key={slot}
                  type="button"
                  className={`min-h-11 border text-sm font-bold ${selected ? "border-accent bg-accent text-white" : "border-line bg-surface hover:border-accent"}`}
                  aria-pressed={selected}
                  onClick={() => onSelectSlot(slot)}
                >
                  {formatInTimeZone(new Date(slot), KYIV_TIME_ZONE, "HH:mm")}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <button type="button" className="button-secondary" onClick={onBack}><ArrowLeft size={16} /> Назад</button>
        <button type="button" className="button-primary" disabled={!selectedSlot} onClick={onContinue}>Продовжити <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}

function DetailsStep({
  form,
  onBack,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<BookingDetails>>;
  onBack: () => void;
  onSubmit: (values: BookingDetails) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className="eyebrow">Крок 3</p>
      <h2 className="display mt-2 text-4xl">Ваші контакти</h2>
      <p className="mt-3 text-sm text-muted">Номер телефону потрібен, щоб студія підтвердила запис.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="Ім’я" error={errors.name?.message}>
          <input className="field" autoComplete="name" {...register("name", { required: "Вкажіть ім’я.", minLength: { value: 2, message: "Вкажіть повне ім’я." } })} />
        </Field>
        <Field label="Телефон" error={errors.phone?.message}>
          <input className="field" inputMode="tel" autoComplete="tel" placeholder="050 123 45 67" {...register("phone", { required: "Вкажіть номер телефону." })} />
        </Field>
        <Field label="Instagram (необов’язково)" error={errors.instagram?.message}>
          <input className="field" autoComplete="off" {...register("instagram")} />
        </Field>
        <Field label="Telegram (необов’язково)" error={errors.telegram?.message}>
          <input className="field" autoComplete="off" {...register("telegram")} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Коментар до запису (необов’язково)" error={errors.clientComment?.message}>
            <textarea className="field min-h-28 resize-y" {...register("clientComment", { maxLength: { value: 1000, message: "Коментар надто довгий." } })} />
          </Field>
        </div>
      </div>
      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <button type="button" className="button-secondary" onClick={onBack}><ArrowLeft size={16} /> Назад</button>
        <button type="submit" className="button-primary">Переглянути запис <ArrowRight size={16} /></button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}{error ? <span role="alert" className="mt-1 block text-xs text-accent-strong">{error}</span> : null}</label>;
}

function ReviewStep({
  service,
  slot,
  details,
  error,
  isSubmitting,
  onBack,
  onConfirm,
}: {
  service: Service;
  slot: string;
  details: BookingDetails;
  error: string;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const appointmentTime = formatInTimeZone(new Date(slot), KYIV_TIME_ZONE, "EEEE, d MMMM 'о' HH:mm");
  return (
    <div>
      <p className="eyebrow">Крок 4</p>
      <h2 className="display mt-2 text-4xl">Перевірте запис</h2>
      <div className="mt-7 divide-y divide-line border-y border-line">
        <div className="flex justify-between gap-4 py-4"><span className="text-muted">Послуга</span><strong className="text-right">{service.name}</strong></div>
        <div className="flex justify-between gap-4 py-4"><span className="text-muted">Дата і час</span><strong className="text-right capitalize">{appointmentTime}</strong></div>
        <div className="flex justify-between gap-4 py-4"><span className="text-muted">Вартість</span><strong>від {service.basePriceUah.toLocaleString("uk-UA")} ₴</strong></div>
        <div className="flex justify-between gap-4 py-4"><span className="text-muted">Клієнтка</span><strong className="text-right">{details.name}<br />{details.phone}</strong></div>
      </div>
      {error ? <p role="alert" className="mt-5 border-l-2 border-accent py-2 pl-4 text-sm text-accent-strong">{error}</p> : null}
      <p className="mt-5 text-sm leading-6 text-muted">Після створення запису студія зв’яжеться з вами для підтвердження.</p>
      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <button type="button" className="button-secondary" disabled={isSubmitting} onClick={onBack}><ArrowLeft size={16} /> Назад</button>
        <button type="button" className="button-primary" disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? <><LoaderCircle className="animate-spin" size={16} /> Створюємо…</> : <><CalendarDays size={16} /> Підтвердити запис</>}
        </button>
      </div>
    </div>
  );
}
