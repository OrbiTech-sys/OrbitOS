"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/lib/auth/actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/schemas";

const FIELDS = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  {
    name: "newPassword",
    label: "New password",
    autoComplete: "new-password",
    hint: `At least ${PASSWORD_MIN_LENGTH} characters, with letters and numbers.`,
  },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} noValidate className="space-y-5" aria-label="Change password">
      {state?.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {/* Lets password managers file the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      {FIELDS.map((f) => {
        const id = `cp-${f.name}`;
        const error = state?.fieldErrors?.[f.name]?.[0];
        const hint = "hint" in f ? f.hint : undefined;
        return (
          <Field key={f.name} id={id} label={f.label} error={error} hint={hint}>
            <Input
              id={id}
              name={f.name}
              type="password"
              autoComplete={f.autoComplete}
              required
              aria-invalid={!!error}
              aria-describedby={describedBy(id, error, hint)}
            />
          </Field>
        );
      })}
      <Button type="submit" variant="navy" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" /> Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
