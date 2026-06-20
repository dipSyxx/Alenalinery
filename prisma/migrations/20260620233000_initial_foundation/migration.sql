CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TYPE "Role" AS ENUM ('ADMIN');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING_CONFIRMATION', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'PENDING_PAYMENT', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "BookingSource" AS ENUM ('WEBSITE', 'ADMIN');

CREATE TABLE "Profile" (
  "id" UUID NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'ADMIN',
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Profile_auth_user_fkey" FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE "ServiceCategory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Service" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "categoryId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "basePriceUah" INTEGER NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
  "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
  "requiresConsultation" BOOLEAN NOT NULL DEFAULT false,
  "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
  "depositAmountUah" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Service_positive_values_check" CHECK ("basePriceUah" >= 0 AND "durationMinutes" > 0 AND "bufferBeforeMinutes" >= 0 AND "bufferAfterMinutes" >= 0)
);

CREATE TABLE "Client" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "instagram" TEXT,
  "telegram" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkingHours" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "weekday" INTEGER NOT NULL,
  "startTime" VARCHAR(5) NOT NULL,
  "endTime" VARCHAR(5) NOT NULL,
  "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkingHours_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkingHours_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "WorkingHours_time_order_check" CHECK ("startTime" < "endTime")
);

CREATE TABLE "ScheduleBlock" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "startAt" TIMESTAMPTZ(3) NOT NULL,
  "endAt" TIMESTAMPTZ(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScheduleBlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ScheduleBlock_time_order_check" CHECK ("startAt" < "endAt")
);

CREATE TABLE "Booking" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "clientId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "startAt" TIMESTAMPTZ(3) NOT NULL,
  "endAt" TIMESTAMPTZ(3) NOT NULL,
  "occupiedFrom" TIMESTAMPTZ(3) NOT NULL,
  "occupiedUntil" TIMESTAMPTZ(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_CONFIRMATION',
  "totalPriceUah" INTEGER NOT NULL,
  "depositAmountUah" INTEGER NOT NULL DEFAULT 0,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  "clientComment" TEXT,
  "adminNotes" TEXT,
  "source" "BookingSource" NOT NULL DEFAULT 'WEBSITE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMPTZ(3),
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Booking_time_order_check" CHECK ("occupiedFrom" <= "startAt" AND "startAt" < "endAt" AND "endAt" <= "occupiedUntil"),
  CONSTRAINT "Booking_money_check" CHECK ("totalPriceUah" >= 0 AND "depositAmountUah" >= 0)
);

CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");
CREATE INDEX "ServiceCategory_isActive_sortOrder_idx" ON "ServiceCategory"("isActive", "sortOrder");
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");
CREATE INDEX "Service_isActive_sortOrder_idx" ON "Service"("isActive", "sortOrder");
CREATE UNIQUE INDEX "Client_phone_key" ON "Client"("phone");
CREATE INDEX "Client_phone_idx" ON "Client"("phone");
CREATE UNIQUE INDEX "WorkingHours_weekday_key" ON "WorkingHours"("weekday");
CREATE INDEX "ScheduleBlock_startAt_endAt_idx" ON "ScheduleBlock"("startAt", "endAt");
CREATE INDEX "Booking_startAt_idx" ON "Booking"("startAt");
CREATE INDEX "Booking_status_startAt_idx" ON "Booking"("status", "startAt");
CREATE INDEX "Booking_clientId_idx" ON "Booking"("clientId");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_active_occupied_range_excl"
  EXCLUDE USING gist (
    tstzrange("occupiedFrom", "occupiedUntil", '[)') WITH &&
  ) WHERE ("status" IN ('PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED'));

ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkingHours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduleBlock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "Profile", "Client", "WorkingHours", "ScheduleBlock", "Booking" FROM anon, authenticated;
GRANT SELECT ON TABLE "ServiceCategory", "Service" TO anon, authenticated;

CREATE POLICY "Active service categories are publicly readable"
  ON "ServiceCategory" FOR SELECT TO anon, authenticated
  USING ("isActive" = true);
CREATE POLICY "Active services are publicly readable"
  ON "Service" FOR SELECT TO anon, authenticated
  USING ("isActive" = true);
CREATE POLICY "Owners can read their profile"
  ON "Profile" FOR SELECT TO authenticated
  USING ("id" = auth.uid()::uuid);
