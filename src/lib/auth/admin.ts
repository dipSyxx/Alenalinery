import { redirect } from "next/navigation";

import { getDb } from "@/lib/db";
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

  return getDb().profile.findFirst({
    where: { id: userId, role: "ADMIN" },
    select: { id: true, displayName: true, role: true },
  });
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
