"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAdmin, type AdminLoginState } from "@/app/admin/actions";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, action] = useActionState(signInAdmin, initialState);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <label className="block">
        <span className="field-label">Email</span>
        <input className="field" type="email" name="email" autoComplete="email" required />
      </label>
      <label className="block">
        <span className="field-label">Пароль</span>
        <input className="field" type="password" name="password" autoComplete="current-password" required />
      </label>
      {state.error ? <p role="alert" className="border-l-2 border-accent py-2 pl-4 text-sm text-accent-strong">{state.error}</p> : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="button-primary w-full" type="submit" disabled={pending}>{pending ? "Входимо…" : "Увійти"}</button>;
}
