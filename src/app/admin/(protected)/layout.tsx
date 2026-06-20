import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return <AdminShell displayName={profile.displayName}>{children}</AdminShell>;
}
