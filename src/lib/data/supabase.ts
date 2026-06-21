import "server-only";

import type { BookingInterval, ScheduleBlockInterval, WorkingDay } from "@/lib/booking/availability";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";

export type BookingStatus =
  | "PENDING_CONFIRMATION"
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "EXPIRED";

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
  status: BookingStatus;
  client: { name: string; phone: string };
  service: { name: string };
};

type SupabaseError = { message: string; code?: string | null };

type RawServiceCategory = Omit<ServiceCategoryRecord, "services">;
type RawScheduleBlock = Omit<ScheduleBlockRecord, "startAt" | "endAt"> & { startAt: string; endAt: string };
type RawBooking = {
  id: string;
  clientId: string;
  serviceId: string;
  startAt: string;
  occupiedFrom: string;
  occupiedUntil: string;
  status: BookingStatus;
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

export async function getAdminBookings({
  startAtGte,
  startAtLt,
  limit,
}: {
  startAtGte?: Date;
  startAtLt?: Date;
  limit?: number;
} = {}): Promise<AdminBookingRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  let bookingsQuery = supabase
    .from("Booking")
    .select("id,clientId,serviceId,startAt,occupiedFrom,occupiedUntil,status")
    .order("startAt", { ascending: false });

  if (startAtGte) bookingsQuery = bookingsQuery.gte("startAt", startAtGte.toISOString());
  if (startAtLt) bookingsQuery = bookingsQuery.lt("startAt", startAtLt.toISOString());
  if (limit) bookingsQuery = bookingsQuery.limit(limit);

  const bookingsResult = await bookingsQuery;
  const bookings = requireData(bookingsResult.data as RawBooking[] | null, bookingsResult.error, "Unable to load bookings");

  if (!bookings.length) {
    return [];
  }

  const clientIds = [...new Set(bookings.map((booking) => booking.clientId))];
  const serviceIds = [...new Set(bookings.map((booking) => booking.serviceId))];
  const [clientsResult, servicesResult] = await Promise.all([
    supabase.from("Client").select("id,name,phone").in("id", clientIds),
    supabase.from("Service").select("id,name").in("id", serviceIds),
  ]);
  const clients = requireData(
    clientsResult.data as Array<{ id: string; name: string; phone: string }> | null,
    clientsResult.error,
    "Unable to load booking clients",
  );
  const services = requireData(
    servicesResult.data as Array<{ id: string; name: string }> | null,
    servicesResult.error,
    "Unable to load booking services",
  );
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const servicesById = new Map(services.map((service) => [service.id, service]));

  return bookings.map((booking) => {
    const client = clientsById.get(booking.clientId);
    const service = servicesById.get(booking.serviceId);

    if (!client || !service) {
      throw new Error(`Booking ${booking.id} has a missing client or service relation.`);
    }

    return {
      id: booking.id,
      startAt: new Date(booking.startAt),
      status: booking.status,
      client,
      service,
    };
  });
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
  const update: Record<string, string | null> = {};

  if (values.status) {
    update.status = values.status;
    if (values.status === "CANCELLED") update.cancelledAt = new Date().toISOString();
  }
  if (values.adminNotes !== undefined) update.adminNotes = values.adminNotes;

  const supabase = createServiceRoleSupabaseClient();
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
