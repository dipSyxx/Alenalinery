"use client";

import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BookingStatusBadge } from "@/components/booking-status-badge";
import { DateCalendarPopover } from "@/components/date-calendar-grid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getAllowedBookingStatuses, type BookingStatus } from "@/lib/admin/booking-status";
import { BUSINESS_TIME_ZONE } from "@/lib/timezone";

import type { AdminBookingView } from "@/components/admin-bookings-workspace";

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_CONFIRMATION: "Очікує підтвердження",
  PENDING_PAYMENT: "Очікує оплати",
  CONFIRMED: "Підтверджено",
  COMPLETED: "Завершено",
  CANCELLED: "Скасовано",
  NO_SHOW: "Не з'явилась",
  EXPIRED: "Протерміновано",
};

const STATUS_BUTTON_LABELS: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: "Підтвердити",
  COMPLETED: "Завершено",
  CANCELLED: "Скасувати",
  NO_SHOW: "Не з'явилась",
  EXPIRED: "Протерміновано",
};

function getTelegramHref(handle: string): string | null {
  const username = handle.startsWith("@") ? handle.slice(1) : handle;
  return /^[a-zA-Z0-9_]{5,32}$/.test(username) ? `https://t.me/${username}` : null;
}

export function AdminBookingSheet({
  booking,
  onClose,
  onUpdate,
}: {
  booking: AdminBookingView | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"details" | "reschedule">("details");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BookingStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  useEffect(() => {
    if (booking) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(booking.adminNotes ?? "");
      setMode("details");
      setActionError(null);
      setRescheduleDate("");
      setRescheduleSlots([]);
      setSelectedSlot(null);
    }
  }, [booking]);

  useEffect(() => {
    if (!rescheduleDate || !booking) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setRescheduleSlots([]);
    setSelectedSlot(null);
    fetch(`/api/availability?serviceId=${booking.service.id}&date=${rescheduleDate}`)
      .then((r) => r.json() as Promise<{ slots?: string[] }>)
      .then((data) => setRescheduleSlots(data.slots ?? []))
      .catch(() => setRescheduleSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [rescheduleDate, booking]);

  async function saveNotes() {
    if (!booking) return;
    setSavingNotes(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? "Помилка збереження");
      }
      toast.success("Нотатки збережено.");
      router.refresh();
      onUpdate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не вдалося зберегти нотатки.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function applyStatus(status: BookingStatus) {
    if (!booking) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? "Помилка зміни статусу");
      }
      toast.success(`Статус: ${STATUS_LABELS[status]}`);
      router.refresh();
      onUpdate();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не вдалося змінити статус.");
    } finally {
      setConfirmOpen(false);
      setPendingStatus(null);
    }
  }

  async function submitReschedule() {
    if (!booking || !rescheduleDate || !selectedSlot) return;
    setSubmittingReschedule(true);
    setActionError(null);
    const timeStr = formatInTimeZone(new Date(selectedSlot), BUSINESS_TIME_ZONE, "HH:mm");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, time: timeStr }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { message?: string };
        throw new Error(body.message ?? "Помилка перенесення");
      }
      toast.success("Запис перенесено.");
      router.refresh();
      onUpdate();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не вдалося перенести запис.");
    } finally {
      setSubmittingReschedule(false);
    }
  }

  if (!booking) return null;

  const startAt = new Date(booking.startAtISO);
  const allowedStatuses = getAllowedBookingStatuses(booking.status);
  const telegramHref = booking.client.telegram ? getTelegramHref(booking.client.telegram) : null;
  const minimumDate = formatInTimeZone(new Date(), BUSINESS_TIME_ZONE, "yyyy-MM-dd");

  return (
    <>
      <Sheet
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <SheetContent side="bottom" className="flex max-h-[90dvh] flex-col rounded-t-2xl bg-studio-surface p-0 text-studio-ink sm:max-w-none">
          <SheetHeader className="border-b border-studio-border px-5 py-4">
            <SheetTitle className="flex items-center gap-3 text-base">
              <BookingStatusBadge status={booking.status} />
              <span>{booking.client.name}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {mode === "details" ? (
              <div className="space-y-5 p-5">
                <div className="text-sm">
                  <p className="font-semibold">
                    {formatInTimeZone(startAt, BUSINESS_TIME_ZONE, "EEEE, d MMMM yyyy 'о' HH:mm")}
                  </p>
                  <p className="text-studio-muted">
                    {booking.service.name} · {booking.service.durationMinutes} хв · {booking.service.basePriceUah} грн
                  </p>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${booking.client.phone}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Phone className="size-3.5" />
                      {booking.client.phone}
                    </Button>
                  </a>
                  {telegramHref && (
                    <a href={telegramHref} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <MessageCircle className="size-3.5" />
                        {booking.client.telegram}
                      </Button>
                    </a>
                  )}
                </div>

                {booking.clientComment && (
                  <div className="bg-studio-surface-raised p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-studio-muted">
                      Коментар клієнта
                    </p>
                    <p>{booking.clientComment}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-studio-muted">Нотатки</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Особливості, побажання…"
                    rows={3}
                    className="resize-none"
                  />
                  <Button size="sm" variant="outline" disabled={savingNotes} onClick={saveNotes}>
                    {savingNotes ? "Збереження…" : "Зберегти нотатки"}
                  </Button>
                </div>

                {actionError && (
                  <p className="border border-studio-danger/35 bg-studio-accent-soft p-3 text-sm text-studio-danger">{actionError}</p>
                )}

                {allowedStatuses.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-studio-muted">Дії</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMode("reschedule")}>
                          Перенести
                        </Button>
                        {allowedStatuses.map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            variant={status === "CANCELLED" || status === "NO_SHOW" ? "destructive" : "default"}
                            onClick={() => {
                              setPendingStatus(status);
                              if (status === "CANCELLED") {
                                setConfirmOpen(true);
                              } else {
                                void applyStatus(status);
                              }
                            }}
                          >
                            {STATUS_BUTTON_LABELS[status] ?? STATUS_LABELS[status]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <Button variant="ghost" size="sm" onClick={() => setMode("details")}>
                  ← Назад
                </Button>
                <p className="font-semibold">Перенести запис</p>
                <DateCalendarPopover
                  value={rescheduleDate}
                  onChange={setRescheduleDate}
                  minDate={minimumDate}
                  label="Дата перенесення запису"
                />

                {rescheduleDate && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-studio-muted">Вільний час</p>
                    {loadingSlots ? (
                      <p className="text-sm text-studio-muted">Завантаження…</p>
                    ) : rescheduleSlots.length === 0 ? (
                      <p className="text-sm text-studio-muted">Вільного часу немає.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {rescheduleSlots.map((slot) => (
                          <Button
                            key={slot}
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

                {actionError && (
                  <p className="border border-studio-danger/35 bg-studio-accent-soft p-3 text-sm text-studio-danger">{actionError}</p>
                )}

                <Button
                  className="w-full"
                  disabled={!selectedSlot || submittingReschedule}
                  onClick={submitReschedule}
                >
                  {submittingReschedule ? "Перенесення…" : "Підтвердити перенесення"}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Скасувати запис?</DialogTitle>
            <DialogDescription>
              Ця дія є остаточною. Запис буде позначено як скасований.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setPendingStatus(null);
              }}
            >
              Відмінити
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingStatus) void applyStatus(pendingStatus);
              }}
            >
              Скасувати запис
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
