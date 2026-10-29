import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Change password" };

export default function PasswordPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-7 shadow-card">
      <h1 className="text-xl font-semibold tracking-tight">Change password</h1>
      <Suspense fallback={<div className="h-80" aria-hidden="true" />}>
        <PasswordSection />
      </Suspense>
    </div>
  );
}

async function PasswordSection() {
  const user = await requireUser();

  return (
    <>
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
        <Link href="/admin" className="mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to admin
        </Link>
      )}
    </>
  );
}
