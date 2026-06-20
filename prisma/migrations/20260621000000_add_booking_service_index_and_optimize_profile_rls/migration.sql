CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

DROP POLICY "Owners can read their profile" ON "Profile";
CREATE POLICY "Owners can read their profile"
  ON "Profile" FOR SELECT TO authenticated
  USING ("id" = (SELECT auth.uid())::uuid);
