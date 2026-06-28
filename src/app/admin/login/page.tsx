import Link from "next/link";

import { AdminLoginForm } from "@/components/admin-login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSafeAdminRedirectPath } from "@/lib/auth/routes";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = getSafeAdminRedirectPath(next);

  return (
    <main className="admin-canvas grid place-items-center p-5">
      <Card className="admin-panel w-full max-w-md [--card-spacing:--spacing(8)]">
        <CardContent>
          <Link href="/" className="font-serif text-3xl font-semibold">Alenalinery</Link>
          <p className="eyebrow mt-8">Адмін-панель</p>
          <h1 className="admin-page-title mt-2 text-4xl">Вхід для власниці</h1>
          <p className="mt-3 text-sm leading-6 text-studio-muted">Використовуйте облікові дані, створені в Supabase Auth.</p>
          <AdminLoginForm nextPath={nextPath} />
        </CardContent>
      </Card>
    </main>
  );
}
