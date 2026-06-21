import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/supabase/env";

export function createServiceRoleSupabaseClient() {
  const { url } = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Supabase data access is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the Worker secret store.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
