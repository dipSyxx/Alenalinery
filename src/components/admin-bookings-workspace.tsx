"use client";

import { addDays, subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AdminBookingSheet } from "@/components/admin-booking-sheet";
import { AdminManualBookingSheet } from "@/components/admin-manual-booking-sheet";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BookingStatus } from "@/lib/admin/booking-status";
import { BUSINESS_TIME_ZONE } from "@/lib/timezone";

// Serializable booking view — all Date objects converted to ISO strings for client components
export type AdminBookingView = {
  id: string;
  startAtISO: string;
  endAtISO: string;
  status: BookingStatus;
  source: "WEBSITE" | "ADMIN";
  totalPriceUah: number;
  clientComment: string | null;
  adminNotes: string | null;
  cancelledAtISO: string | null;
  client: { id: string; name: string; phone: string; instagram: string | null; telegram: string | null };
  service: { id: string; name: string; durationMinutes: number; basePriceUah: number };
};

type Filter = "active" | "all" | "completed" | "cancelled";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "active", label: "Активні" },
  { value: "all", label: "Усі" },
  { value: "completed", label: "Завершені" },
  { value: "cancelled", label: "Скасовані" },
];

const ACTIVE_STATUSES: BookingStatus[] = ["PENDING_CONFIRMATION", "PENDING_PAYMENT", "CONFIRMED"];

function filterBookings(bookings: AdminBookingView[], filter: Filter): AdminBookingView[] {
  switch (filter) {
    case "active":
      return bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
    case "completed":
      return bookings.filter((b) => b.status === "COMPLETED");
    case "cancelled":
      return bookings.filter((b) => ["CANCELLED", "NO_SHOW", "EXPIRED"].includes(b.status));
    default:
      return bookings;
  }
}

export function AdminBookingsWorkspace({
  bookings,
  selectedDate,
  showManualCreate = false,
}: {
  bookings: AdminBookingView[];
  selectedDate: string;
  showManualCreate?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>(showManualCreate ? "active" : "all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const currentDate = new Date(`${selectedDate}T12:00:00Z`);
  const filtered = filterBookings(bookings, filter);
  const selectedBooking = selectedId ? (bookings.find((b) => b.id === selectedId) ?? null) : null;

  function navigateDate(date: Date) {
    const dateStr = formatInTimeZone(date, BUSINESS_TIME_ZONE, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateStr);
    router.push(`?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Попередній день"
            onClick={() => navigateDate(subDays(currentDate, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-36 text-sm">
                {formatInTimeZone(currentDate, BUSINESS_TIME_ZONE, "d MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => {
                  if (d) {
                    navigateDate(d);
                    setCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            aria-label="Наступний день"
            onClick={() => navigateDate(addDays(currentDate, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {showManualCreate && (
          <Button size="sm" className="gap-1.5" onClick={() => setManualOpen(true)}>
            <Plus className="size-4" />
            <span className="hidden sm:inline">Новий запис</span>
          </Button>
        )}
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "ghost"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {filter === "active" ? "Активних записів немає." : "Записів немає."}
          </div>
        ) : (
          filtered.map((booking) => (
            <button
              key={booking.id}
              className="w-full rounded-xl border bg-white px-4 py-3 text-left transition hover:shadow-sm active:scale-[0.99]"
              onClick={() => setSelectedId(booking.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatInTimeZone(new Date(booking.startAtISO), BUSINESS_TIME_ZONE, "HH:mm")}
                    </span>
                    <span className="truncate text-sm font-medium">{booking.client.name}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{booking.service.name}</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>
            </button>
          ))
        )}
      </div>

      <AdminBookingSheet
        booking={selectedBooking}
        onClose={() => setSelectedId(null)}
        onUpdate={() => setSelectedId(null)}
      />

      <AdminManualBookingSheet open={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}
