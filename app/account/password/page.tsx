import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default function PasswordPage({ searchParams }: PageProps<"/account/password">) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-7 shadow-card">
      <Suspense fallback={<div className="h-80" aria-hidden="true" />}>
        <PasswordSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PasswordSection({ searchParams }: Pick<PageProps<"/account/password">, "searchParams">) {
  const user = await requireUser({ allowTemporaryPassword: true });
  const { done } = await searchParams;

  if (done === "1" && !user.mustChangePassword) {
    return (
      <div role="status">
        <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Your password was updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use it the next time you sign in.</p>
        <Button asChild variant="navy" className="mt-6 w-full">
          <Link href="/workspace">
            Continue to your workspace <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Change password</h1>
      {user.mustChangePassword ? (
        <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          This account is using a temporary password. Choose a new one to continue.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
      )}
      <div className="mt-6">
        <ChangePasswordForm email={user.email} />
      </div>
      {!user.mustChangePassword && (
        <Link href="/workspace" className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </Link>
      )}
    </>
  );
}
