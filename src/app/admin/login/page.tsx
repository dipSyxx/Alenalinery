import Link from "next/link";

import { AdminLoginForm } from "@/components/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="w-full max-w-md border border-line bg-surface p-6 sm:p-9">
        <Link href="/" className="font-serif text-3xl font-semibold">Alenalinery</Link>
        <p className="eyebrow mt-8">Адмін-панель</p>
        <h1 className="display mt-2 text-4xl">Вхід для власниці</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Використовуйте облікові дані, створені в Supabase Auth.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
