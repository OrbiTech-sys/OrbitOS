import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DatabaseZap, LockKeyhole } from "lucide-react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SignedInNotice } from "@/components/auth/signed-in-notice";
import { LogoMark } from "@/components/shared/logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-elevated">
        <div className="text-center">
          <LogoMark className="mx-auto size-11" />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Sign in to OrbitOS</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Accounts are created by an administrator. There is no public sign-up.</p>
        </div>
        <Suspense fallback={null}>
          <SignedInNotice />
        </Suspense>
        <div className="mt-7">
          {isSupabaseConfigured() ? (
            <Suspense fallback={<div className="h-[15.5rem]" aria-hidden="true" />}>
              <SignInForm />
            </Suspense>
          ) : (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-warning">
              <DatabaseZap className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              The database isn&apos;t connected yet. Add the Supabase settings to .env.local and restart the server.
            </p>
          )}
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" aria-hidden="true" /> Just looking around?{" "}
          <Link href="/demo" className="font-medium text-foreground underline-offset-4 hover:underline">
            Explore the live demo
          </Link>
        </p>
      </div>
    </section>
  );
}
