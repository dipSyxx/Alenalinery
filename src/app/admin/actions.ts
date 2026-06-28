"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { getAdminProfileById } from "@/lib/data/supabase";
import { getSafeAdminRedirectPath } from "@/lib/auth/routes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminLoginState = { error?: string };

const loginSchema = z.object({
  email: z.string().trim().email("Вкажіть коректний email."),
  password: z.string().min(1, "Вкажіть пароль."),
});

export async function signInAdmin(_: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const redirectTo = getSafeAdminRedirectPath(formData.get("next"));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Перевірте дані входу." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.user) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[signInAdmin] signInWithPassword failed:", error);
      }
      return { error: "Не вдалося увійти. Перевірте email і пароль." };
    }

    const profile = await getAdminProfileById(data.user.id);

    if (!profile) {
      await supabase.auth.signOut();
      return { error: "Цей обліковий запис не має доступу до адмін-панелі." };
    }
  } catch (cause) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[signInAdmin] unexpected error:", cause);
    }
    return { error: "Налаштуйте Supabase Auth перед входом до адмін-панелі." };
  }

  redirect(redirectTo);
}
