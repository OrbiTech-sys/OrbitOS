"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth/actions";

export function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const sessionEnded = params.get("reason") === "session";
  const [state, formAction, pending] = useActionState(signIn, undefined);
  const emailError = state?.fieldErrors?.email?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <form action={formAction} noValidate className="space-y-5 text-left" aria-label="Sign in">
      {sessionEnded && !state && (
        <p role="status" className="rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
          Your session has ended. Please sign in again.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <Field id="si-email" label="Email" error={emailError}>
        <Input
          id="si-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state?.email}
          aria-invalid={!!emailError}
          aria-describedby={describedBy("si-email", emailError)}
        />
      </Field>
      <Field id="si-password" label="Password" error={passwordError}>
        <Input
          id="si-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={!!passwordError}
          aria-describedby={describedBy("si-password", passwordError)}
        />
      </Field>
      <Button type="submit" variant="navy" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" /> Signing in…
          </>
        ) : (
          <>
            Sign in <ArrowRight />
          </>
        )}
      </Button>
    </form>
  );
}
