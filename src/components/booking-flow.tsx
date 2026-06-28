"use client";

import { formatInTimeZone } from "date-fns-tz";
import { ArrowLeft, ArrowRight, CalendarDays, Check, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateCalendarGrid } from "@/components/date-calendar-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="booking-workspace grid gap-8 p-5 sm:p-8 lg:grid-cols-[13rem_1fr]">
      <ol className="grid grid-cols-4 gap-2 border-b border-studio-border pb-5 lg:grid-cols-1 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
        {["Послуга", "Дата і час", "Контакти", "Підтвердження"].map((label, index) => {
          const current = index + 1 === step;
          const complete = index + 1 < step;
          return (
            <li key={label} className={`text-xs font-bold ${current ? "text-studio-accent" : complete ? "text-studio-ink" : "text-studio-muted"}`}>
              <span className="mr-1 inline-flex h-5 w-5 items-center justify-center border border-current text-xs">
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
  if (status === "loading") {
    return (
      <div>
        <p className="eyebrow">Крок 1</p>
        <h2 className="display mt-2 text-4xl">Оберіть послугу</h2>
        <div className="mt-7 space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-20 w-full bg-studio-surface-raised" />
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="border-studio-danger/35 bg-studio-accent-soft text-studio-ink">
        <AlertTitle>Не вдалося завантажити послуги</AlertTitle>
        <AlertDescription>Спробуйте оновити сторінку трохи пізніше.</AlertDescription>
      </Alert>
    );
  }

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
                    className={`grid gap-2 border p-4 text-left transition sm:grid-cols-[1fr_auto] sm:items-center ${selected ? "border-studio-accent bg-studio-accent-soft" : "border-studio-border bg-studio-surface hover:border-studio-accent"}`}
                    aria-pressed={selected}
                    onClick={() => onSelect(item.id)}
                  >
                    <span>
                      <span className="flex flex-wrap items-center gap-2 font-bold">
                        {item.name}
                        {item.requiresConsultation ? (
                          <Badge variant="outline" className="border-studio-accent/40 text-studio-accent">Консультація</Badge>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-studio-muted">{item.description}</span>
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
      <p className="mt-3 text-sm text-studio-muted">{service.name} · від {service.basePriceUah.toLocaleString("uk-UA")} ₴</p>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-start">
        <div className="grid gap-2">
          <Label>Оберіть дату</Label>
          <DateCalendarGrid
            value={date}
            onChange={onDateChange}
            minDate={minimumDate}
            label="Дата запису"
          />
        </div>

        <div className="min-h-48">
          {status === "idle" ? (
            <p className="border border-dashed border-studio-border bg-studio-surface-raised p-5 text-sm leading-6 text-studio-muted">
              Оберіть день у календарі, щоб побачити доступний час.
            </p>
          ) : null}
          {status === "loading" ? (
            <div>
              <p className="mb-3 text-sm font-bold">Вільний час</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((cell) => (
                  <Skeleton key={cell} className="h-11 w-full bg-studio-surface-raised" />
                ))}
              </div>
            </div>
          ) : null}
          {status === "error" ? (
            <Alert variant="destructive" className="border-studio-danger/35 bg-studio-accent-soft text-studio-ink">
              <AlertTitle>Не вдалося завантажити вільний час</AlertTitle>
              <AlertDescription>Спробуйте обрати дату ще раз.</AlertDescription>
            </Alert>
          ) : null}
          {status === "ready" && slots.length === 0 ? (
            <p className="border border-dashed border-studio-border bg-studio-surface-raised p-5 text-sm leading-6 text-studio-muted">
              На цю дату немає вільних слотів. Оберіть інший день.
            </p>
          ) : null}
          {status === "ready" && slots.length > 0 ? (
            <fieldset>
              <legend className="mb-3 text-sm font-bold">Вільний час</legend>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const selected = slot === selectedSlot;
                  return (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      className={`h-11 font-bold ${selected ? "border-studio-accent bg-studio-accent text-studio-surface hover:bg-studio-accent-strong hover:text-studio-surface" : "border-studio-border bg-studio-surface hover:border-studio-accent"}`}
                      aria-pressed={selected}
                      onClick={() => onSelectSlot(slot)}
                    >
                      {formatInTimeZone(new Date(slot), KYIV_TIME_ZONE, "HH:mm")}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </div>
      </div>
      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" className="h-11 px-5" onClick={onBack}><ArrowLeft className="size-4" /> Назад</Button>
        <Button type="button" className="h-11 px-5" disabled={!selectedSlot} onClick={onContinue}>Продовжити <ArrowRight className="size-4" /></Button>
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
      <p className="mt-3 text-sm text-studio-muted">Номер телефону потрібен, щоб студія підтвердила запис.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field id="booking-name" label="Ім’я" error={errors.name?.message}>
          <Input id="booking-name" className="h-11" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "booking-name-error" : undefined} {...register("name", { required: "Вкажіть ім’я.", minLength: { value: 2, message: "Вкажіть повне ім’я." } })} />
        </Field>
        <Field id="booking-phone" label="Телефон" error={errors.phone?.message}>
          <Input id="booking-phone" className="h-11" inputMode="tel" autoComplete="tel" placeholder="050 123 45 67" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "booking-phone-error" : undefined} {...register("phone", { required: "Вкажіть номер телефону." })} />
        </Field>
        <Field id="booking-instagram" label="Instagram (необов’язково)" error={errors.instagram?.message}>
          <Input id="booking-instagram" className="h-11" autoComplete="off" {...register("instagram")} />
        </Field>
        <Field id="booking-telegram" label="Telegram (необов’язково)" error={errors.telegram?.message}>
          <Input id="booking-telegram" className="h-11" autoComplete="off" {...register("telegram")} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="booking-comment" label="Коментар до запису (необов’язково)" error={errors.clientComment?.message}>
            <Textarea id="booking-comment" className="min-h-28" aria-invalid={!!errors.clientComment} aria-describedby={errors.clientComment ? "booking-comment-error" : undefined} {...register("clientComment", { maxLength: { value: 1000, message: "Коментар надто довгий." } })} />
          </Field>
        </div>
      </div>
      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" className="h-11 px-5" onClick={onBack}><ArrowLeft className="size-4" /> Назад</Button>
        <Button type="submit" className="h-11 px-5">Переглянути запис <ArrowRight className="size-4" /></Button>
      </div>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
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
      <Card className="admin-panel mt-7">
        <CardContent className="grid gap-0">
          <SummaryRow label="Послуга" value={service.name} />
          <Separator />
          <SummaryRow label="Дата і час" value={<span className="capitalize">{appointmentTime}</span>} />
          <Separator />
          <SummaryRow label="Вартість" value={`від ${service.basePriceUah.toLocaleString("uk-UA")} ₴`} />
          <Separator />
          <SummaryRow label="Клієнтка" value={<span>{details.name}<br />{details.phone}</span>} />
        </CardContent>
      </Card>
      {error ? (
        <Alert variant="destructive" className="mt-5 border-studio-danger/35 bg-studio-accent-soft text-studio-ink">
          <AlertTitle>Запис не створено</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <p className="mt-5 text-sm leading-6 text-studio-muted">Після створення запису студія зв’яжеться з вами для підтвердження.</p>
      <div className="mt-9 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" className="h-11 px-5" disabled={isSubmitting} onClick={onBack}><ArrowLeft className="size-4" /> Назад</Button>
        <Button type="button" className="h-11 px-5" disabled={isSubmitting} onClick={onConfirm}>
          {isSubmitting ? <><LoaderCircle className="size-4 animate-spin" /> Створюємо…</> : <><CalendarDays className="size-4" /> Підтвердити запис</>}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <span className="text-studio-muted">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}
