import { redirect } from "next/navigation";

import { getAdminProfileById } from "@/lib/data/supabase";
import { hasSupabasePublicConfig } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminProfile() {
  if (!hasSupabasePublicConfig()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return null;
  }

  return getAdminProfileById(userId);
}

export async function requireAdmin() {
  const profile = await getAdminProfile();

  if (!profile) {
    redirect("/admin/login");
  }

  return profile;
}

export async function getAdminProfileForApi() {
  try {
    return await getAdminProfile();
  } catch {
    return null;
  }
}
