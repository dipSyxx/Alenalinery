"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signInAdmin, type AdminLoginState } from "@/app/admin/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, action] = useActionState(signInAdmin, initialState);

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="admin-email">Email</Label>
        <Input id="admin-email" className="h-11" type="email" name="email" autoComplete="email" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="admin-password">Пароль</Label>
        <Input id="admin-password" className="h-11" type="password" name="password" autoComplete="current-password" required />
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="h-11 w-full" type="submit" disabled={pending}>
      {pending ? "Входимо…" : "Увійти"}
    </Button>
  );
}
