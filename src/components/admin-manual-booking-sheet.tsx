"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DateCalendarPopover } from "@/components/date-calendar-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TIME_ZONE } from "@/lib/timezone";

type ServiceOption = { id: string; name: string };
type CategoryOption = { name: string; services: ServiceOption[] };

export function AdminManualBookingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [serviceSelectOpen, setServiceSelectOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const serviceSelectOpenRef = useRef(false);
  const calendarOpenRef = useRef(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [clientComment, setClientComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/services")
      .then((r) => r.json() as Promise<{ categories?: CategoryOption[] }>)
      .then((data) => setCategories(data.categories ?? []))
      .catch(() => setCategories([]));
  }, [open]);

  useEffect(() => {
    if (!serviceId || !date) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot(null);
    fetch(`/api/availability?serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json() as Promise<{ slots?: string[] }>)
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [serviceId, date]);

  function resetForm() {
    setServiceId("");
    setDate("");
    setServicePickerOpen(false);
    setDatePickerOpen(false);
    setSlots([]);
    setSelectedSlot(null);
    setName("");
    setPhone("");
    setInstagram("");
    setTelegram("");
    setClientComment("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !date || !selectedSlot || !name || !phone) return;
    const timeStr = formatInTimeZone(new Date(selectedSlot), BUSINESS_TIME_ZONE, "HH:mm");
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          time: timeStr,
          name: name.trim(),
          phone: phone.trim(),
          instagram: instagram.trim() || undefined,
          telegram: telegram.trim() || undefined,
          clientComment: clientComment.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? "Не вдалося створити запис.");
      }
      toast.success("Запис створено.");
      resetForm();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити запис.");
    } finally {
      setSubmitting(false);
    }
  }

  const allServices = categories.flatMap((c) => c.services);
  const minimumDate = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");

  function setServicePickerOpen(open: boolean) {
    serviceSelectOpenRef.current = open;
    setServiceSelectOpen(open);
  }

  function setDatePickerOpen(open: boolean) {
    calendarOpenRef.current = open;
    setCalendarOpen(open);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm();
          onClose();
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="flex max-h-[95dvh] flex-col rounded-t-2xl bg-studio-surface p-0 text-studio-ink sm:max-w-none"
        onInteractOutside={(event) => {
          if (serviceSelectOpenRef.current || calendarOpenRef.current) {
            event.preventDefault();
          }
        }}
      >
        <SheetHeader className="border-b border-studio-border px-5 py-4">
          <SheetTitle>Новий запис</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label>Послуга *</Label>
              <Select
                open={serviceSelectOpen}
                onOpenChange={setServicePickerOpen}
                value={serviceId}
                onValueChange={(value) => {
                  setServiceId(value);
                  setSlots([]);
                  setSelectedSlot(null);
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Оберіть послугу" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <div key={cat.name}>
                      <p className="px-2 py-1 text-xs font-semibold text-studio-muted">{cat.name}</p>
                      {cat.services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                  {allServices.length === 0 && (
                    <p className="px-2 py-2 text-sm text-studio-muted">Послуги не знайдено.</p>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Дата *</Label>
              <DateCalendarPopover
                value={date}
                onChange={setDate}
                minDate={minimumDate}
                open={calendarOpen}
                onOpenChange={setDatePickerOpen}
                label="Дата нового запису"
              />
            </div>

            {date && serviceId && (
              <div className="space-y-1.5">
                <Label>Час *</Label>
                {loadingSlots ? (
                  <p className="text-sm text-studio-muted">Завантаження…</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-studio-muted">Вільного часу немає.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        size="sm"
                        variant={selectedSlot === slot ? "default" : "outline"}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {formatInTimeZone(new Date(slot), BUSINESS_TIME_ZONE, "HH:mm")}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="m-name">Ім&apos;я *</Label>
              <Input id="m-name" className="h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Олена" required minLength={2} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-phone">Телефон *</Label>
              <Input id="m-phone" className="h-11" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380501234567" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-instagram">Instagram</Label>
              <Input id="m-instagram" className="h-11" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-telegram">Telegram</Label>
              <Input id="m-telegram" className="h-11" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="m-comment">Коментар</Label>
              <Textarea id="m-comment" value={clientComment} onChange={(e) => setClientComment(e.target.value)} placeholder="Побажання…" rows={3} className="resize-none" />
            </div>

            {error && <p className="border border-studio-danger/35 bg-studio-accent-soft p-3 text-sm text-studio-danger">{error}</p>}

            <Button type="submit" className="h-11 w-full" disabled={submitting || !serviceId || !date || !selectedSlot || !name || !phone}>
              {submitting ? "Збереження…" : "Створити запис"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
