import "server-only";

import type { BookingInterval, ScheduleBlockInterval, WorkingDay } from "@/lib/booking/availability";
import { BookingConflictError, BookingValidationError } from "@/lib/booking/create-booking";
import { assertBookingStatusTransition, type BookingStatus } from "@/lib/admin/booking-status";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";

export type { BookingStatus };

export type ServiceRecord = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePriceUah: number;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  requiresConsultation: boolean;
  requiresDeposit: boolean;
  depositAmountUah: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type ServiceCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  services: ServiceRecord[];
};

export type WorkingHoursRecord = WorkingDay & {
  id: string;
  weekday: number;
};

export type ScheduleBlockRecord = {
  id: string;
  startAt: Date;
  endAt: Date;
  reason: string | null;
};

export type AdminBookingRecord = {
  id: string;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  source: "WEBSITE" | "ADMIN";
  totalPriceUah: number;
  clientComment: string | null;
  adminNotes: string | null;
  cancelledAt: Date | null;
  client: { id: string; name: string; phone: string; instagram: string | null; telegram: string | null };
  service: { id: string; name: string; durationMinutes: number; basePriceUah: number };
};

export class BookingNotFoundError extends Error {
  constructor() {
    super("BOOKING_NOT_FOUND");
    this.name = "BookingNotFoundError";
  }
}

type SupabaseError = { message: string; code?: string | null };

type RawServiceCategory = Omit<ServiceCategoryRecord, "services">;
type RawScheduleBlock = Omit<ScheduleBlockRecord, "startAt" | "endAt"> & { startAt: string; endAt: string };
type RawBooking = {
  id: string;
  clientId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  occupiedFrom: string;
  occupiedUntil: string;
  status: BookingStatus;
  source: "WEBSITE" | "ADMIN";
  totalPriceUah: number;
  clientComment: string | null;
  adminNotes: string | null;
  cancelledAt: string | null;
};

function requireData<T>(data: T | null, error: SupabaseError | null, operation: string): T {
  if (error) {
    throw new Error(`${operation}: ${error.message}`);
  }

  if (data === null) {
    throw new Error(`${operation}: Supabase returned no data.`);
  }

  return data;
}

function requireSingle<T>(data: T | null, error: SupabaseError | null, operation: string): T {
  return requireData(data, error, operation);
}

export async function getPublicServiceCategories(): Promise<ServiceCategoryRecord[]> {
  return getServiceCategories({ activeOnly: true });
}

export async function getAdminServiceCategories(): Promise<ServiceCategoryRecord[]> {
  return getServiceCategories({ activeOnly: false });
}

async function getServiceCategories({ activeOnly }: { activeOnly: boolean }): Promise<ServiceCategoryRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  let categoriesQuery = supabase
    .from("ServiceCategory")
    .select("id,name,slug,description,sortOrder,isActive")
    .order("sortOrder", { ascending: true });
  let servicesQuery = supabase
    .from("Service")
    .select(
      "id,categoryId,name,slug,description,basePriceUah,durationMinutes,bufferBeforeMinutes,bufferAfterMinutes,requiresConsultation,requiresDeposit,depositAmountUah,isActive,sortOrder",
    )
    .order("sortOrder", { ascending: true });

  if (activeOnly) {
    categoriesQuery = categoriesQuery.eq("isActive", true);
    servicesQuery = servicesQuery.eq("isActive", true);
  }

  const [categoriesResult, servicesResult] = await Promise.all([categoriesQuery, servicesQuery]);
  const categories = requireData(
    categoriesResult.data as RawServiceCategory[] | null,
    categoriesResult.error,
    "Unable to load service categories",
  );
  const services = requireData(
    servicesResult.data as ServiceRecord[] | null,
    servicesResult.error,
    "Unable to load services",
  );
  const servicesByCategory = new Map<string, ServiceRecord[]>();

  for (const service of services) {
    const categoryServices = servicesByCategory.get(service.categoryId) ?? [];
    categoryServices.push(service);
    servicesByCategory.set(service.categoryId, categoryServices);
  }

  return categories.map((category) => ({
    ...category,
    services: servicesByCategory.get(category.id) ?? [],
  }));
}

export async function getActiveService(serviceId: string): Promise<ServiceRecord | null> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("Service")
    .select(
      "id,categoryId,name,slug,description,basePriceUah,durationMinutes,bufferBeforeMinutes,bufferAfterMinutes,requiresConsultation,requiresDeposit,depositAmountUah,isActive,sortOrder",
    )
    .eq("id", serviceId)
    .eq("isActive", true)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Unable to load service: ${result.error.message}`);
  }

  return result.data as ServiceRecord | null;
}

export async function getWorkingHoursByWeekday(weekday: number): Promise<WorkingHoursRecord | null> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("WorkingHours")
    .select("id,weekday,startTime,endTime,isWorkingDay")
    .eq("weekday", weekday)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Unable to load working hours: ${result.error.message}`);
  }

  return result.data as WorkingHoursRecord | null;
}

export async function getBlockingBookingIntervals({
  occupiedFrom,
  occupiedUntil,
}: {
  occupiedFrom: Date;
  occupiedUntil: Date;
}): Promise<BookingInterval[]> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("Booking")
    .select("startAt,occupiedFrom,occupiedUntil,status")
    .in("status", ["PENDING_CONFIRMATION", "PENDING_PAYMENT", "CONFIRMED", "COMPLETED"])
    .lt("occupiedFrom", occupiedUntil.toISOString())
    .gt("occupiedUntil", occupiedFrom.toISOString());
  const rows = requireData(
    result.data as Array<Omit<RawBooking, "id" | "clientId" | "serviceId">> | null,
    result.error,
    "Unable to load bookings",
  );

  return rows.map((booking) => ({
    startAt: new Date(booking.startAt),
    occupiedFrom: new Date(booking.occupiedFrom),
    occupiedUntil: new Date(booking.occupiedUntil),
    status: booking.status,
  }));
}

export async function getScheduleBlockIntervals({
  occupiedFrom,
  occupiedUntil,
}: {
  occupiedFrom: Date;
  occupiedUntil: Date;
}): Promise<ScheduleBlockInterval[]> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("ScheduleBlock")
    .select("startAt,endAt")
    .lt("startAt", occupiedUntil.toISOString())
    .gt("endAt", occupiedFrom.toISOString());
  const rows = requireData(result.data as Array<{ startAt: string; endAt: string }> | null, result.error, "Unable to load schedule blocks");

  return rows.map((block) => ({ startAt: new Date(block.startAt), endAt: new Date(block.endAt) }));
}

export async function getAdminProfileById(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("Profile")
    .select("id,displayName,role")
    .eq("id", userId)
    .eq("role", "ADMIN")
    .maybeSingle();

  if (result.error) {
    throw new Error(`Unable to load admin profile: ${result.error.message}`);
  }

  return result.data as { id: string; displayName: string; role: "ADMIN" } | null;
}

const BOOKING_SELECT = "id,clientId,serviceId,startAt,endAt,occupiedFrom,occupiedUntil,status,source,totalPriceUah,clientComment,adminNotes,cancelledAt";
const CLIENT_SELECT = "id,name,phone,instagram,telegram";
const SERVICE_SELECT = "id,name,durationMinutes,basePriceUah";

function mapBookingRows(
  bookings: RawBooking[],
  clientsById: Map<string, AdminBookingRecord["client"]>,
  servicesById: Map<string, AdminBookingRecord["service"]>,
): AdminBookingRecord[] {
  return bookings.map((booking) => {
    const client = clientsById.get(booking.clientId);
    const service = servicesById.get(booking.serviceId);

    if (!client || !service) {
      throw new Error(`Booking ${booking.id} has a missing client or service relation.`);
    }

    return {
      id: booking.id,
      startAt: new Date(booking.startAt),
      endAt: new Date(booking.endAt),
      status: booking.status,
      source: booking.source,
      totalPriceUah: booking.totalPriceUah,
      clientComment: booking.clientComment,
      adminNotes: booking.adminNotes,
      cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null,
      client,
      service,
    };
  });
}

export async function getAdminBookings({
  startAtGte,
  startAtLt,
  limit,
  ascending = false,
}: {
  startAtGte?: Date;
  startAtLt?: Date;
  limit?: number;
  ascending?: boolean;
} = {}): Promise<AdminBookingRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  let bookingsQuery = supabase
    .from("Booking")
    .select(BOOKING_SELECT)
    .order("startAt", { ascending });

  if (startAtGte) bookingsQuery = bookingsQuery.gte("startAt", startAtGte.toISOString());
  if (startAtLt) bookingsQuery = bookingsQuery.lt("startAt", startAtLt.toISOString());
  if (limit) bookingsQuery = bookingsQuery.limit(limit);

  const bookingsResult = await bookingsQuery;
  const bookings = requireData(bookingsResult.data as RawBooking[] | null, bookingsResult.error, "Unable to load bookings");

  if (!bookings.length) return [];

  const clientIds = [...new Set(bookings.map((b) => b.clientId))];
  const serviceIds = [...new Set(bookings.map((b) => b.serviceId))];
  const [clientsResult, servicesResult] = await Promise.all([
    supabase.from("Client").select(CLIENT_SELECT).in("id", clientIds),
    supabase.from("Service").select(SERVICE_SELECT).in("id", serviceIds),
  ]);
  const clients = requireData(
    clientsResult.data as AdminBookingRecord["client"][] | null,
    clientsResult.error,
    "Unable to load booking clients",
  );
  const services = requireData(
    servicesResult.data as AdminBookingRecord["service"][] | null,
    servicesResult.error,
    "Unable to load booking services",
  );

  return mapBookingRows(
    bookings,
    new Map(clients.map((c) => [c.id, c])),
    new Map(services.map((s) => [s.id, s])),
  );
}

export async function getAdminBookingById(id: string): Promise<AdminBookingRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase.from("Booking").select(BOOKING_SELECT).eq("id", id).maybeSingle();

  if (result.error) throw new Error(`Unable to load booking: ${result.error.message}`);
  if (!result.data) throw new BookingNotFoundError();

  const booking = result.data as RawBooking;
  const [clientResult, serviceResult] = await Promise.all([
    supabase.from("Client").select(CLIENT_SELECT).eq("id", booking.clientId).single(),
    supabase.from("Service").select(SERVICE_SELECT).eq("id", booking.serviceId).single(),
  ]);

  if (clientResult.error || !clientResult.data) throw new Error("Unable to load booking client");
  if (serviceResult.error || !serviceResult.data) throw new Error("Unable to load booking service");

  return mapBookingRows(
    [booking],
    new Map([[booking.clientId, clientResult.data as AdminBookingRecord["client"]]]),
    new Map([[booking.serviceId, serviceResult.data as AdminBookingRecord["service"]]]),
  )[0]!;
}

export async function getClientCount(): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase.from("Client").select("id", { count: "exact", head: true });

  if (result.error) {
    throw new Error(`Unable to count clients: ${result.error.message}`);
  }

  return result.count ?? 0;
}

export async function getWorkingHours(): Promise<WorkingHoursRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("WorkingHours")
    .select("id,weekday,startTime,endTime,isWorkingDay")
    .order("weekday", { ascending: true });

  return requireData(result.data as WorkingHoursRecord[] | null, result.error, "Unable to load working hours");
}

export async function getFutureScheduleBlocks(now = new Date()): Promise<ScheduleBlockRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("ScheduleBlock")
    .select("id,startAt,endAt,reason")
    .gte("endAt", now.toISOString())
    .order("startAt", { ascending: true });
  const rows = requireData(result.data as RawScheduleBlock[] | null, result.error, "Unable to load schedule blocks");

  return rows.map((block) => ({ ...block, startAt: new Date(block.startAt), endAt: new Date(block.endAt) }));
}

export async function updateWorkingHours(
  id: string,
  values: Pick<WorkingHoursRecord, "startTime" | "endTime" | "isWorkingDay">,
): Promise<WorkingHoursRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("WorkingHours")
    .update(values)
    .eq("id", id)
    .select("id,weekday,startTime,endTime,isWorkingDay")
    .single();

  return requireSingle(result.data as WorkingHoursRecord | null, result.error, "Unable to update working hours");
}

export async function createScheduleBlock({
  startAt,
  endAt,
  reason,
}: {
  startAt: Date;
  endAt: Date;
  reason?: string;
}): Promise<ScheduleBlockRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase
    .from("ScheduleBlock")
    .insert({ startAt: startAt.toISOString(), endAt: endAt.toISOString(), reason: reason || null })
    .select("id,startAt,endAt,reason")
    .single();
  const block = requireSingle(result.data as RawScheduleBlock | null, result.error, "Unable to create schedule block");

  return { ...block, startAt: new Date(block.startAt), endAt: new Date(block.endAt) };
}

export async function updateAdminBooking(
  id: string,
  values: { status?: BookingStatus; adminNotes?: string | null },
): Promise<{ id: string; status: BookingStatus; adminNotes: string | null; cancelledAt: Date | null }> {
  if (values.status === undefined && values.adminNotes === undefined) {
    throw new Error("updateAdminBooking requires at least one value to update.");
  }

  const supabase = createServiceRoleSupabaseClient();
  const update: Record<string, string | null> = {};

  if (values.status !== undefined) {
    const current = await supabase.from("Booking").select("status").eq("id", id).maybeSingle();
    if (current.error || !current.data) throw new BookingNotFoundError();
    assertBookingStatusTransition(current.data.status as BookingStatus, values.status);
    update.status = values.status;
    if (values.status === "CANCELLED") update.cancelledAt = new Date().toISOString();
  }

  if (values.adminNotes !== undefined) update.adminNotes = values.adminNotes;

  const result = await supabase
    .from("Booking")
    .update(update)
    .eq("id", id)
    .select("id,status,adminNotes,cancelledAt")
    .single();
  const booking = requireSingle(
    result.data as { id: string; status: BookingStatus; adminNotes: string | null; cancelledAt: string | null } | null,
    result.error,
    "Unable to update booking",
  );

  return { ...booking, cancelledAt: booking.cancelledAt ? new Date(booking.cancelledAt) : null };
}

export async function rescheduleAdminBooking(
  id: string,
  date: string,
  time: string,
): Promise<AdminBookingRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase.rpc("reschedule_booking", {
    p_booking_id: id,
    p_date: date,
    p_time: time,
  });

  if (result.error) {
    const msg = result.error.message;
    if (msg === "BOOKING_CONFLICT") throw new BookingConflictError();
    if (msg === "BOOKING_NOT_FOUND") throw new BookingNotFoundError();
    if (msg === "BOOKING_NOT_RESCHEDULABLE") throw new BookingValidationError("BOOKING_NOT_RESCHEDULABLE");
    if (msg === "BOOKING_IN_PAST") throw new BookingValidationError("BOOKING_IN_PAST");
    throw new Error(`Unable to reschedule booking: ${msg}`);
  }

  const raw = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!raw) throw new BookingNotFoundError();

  return getAdminBookingById(raw.id as string);
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const result = await supabase.from("ScheduleBlock").delete().eq("id", id).select("id").maybeSingle();

  if (result.error) throw new Error(`Unable to delete schedule block: ${result.error.message}`);
  if (!result.data) throw new BookingValidationError("SCHEDULE_BLOCK_NOT_FOUND");
}
