import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-elevated">
        <LogoMark className="mx-auto size-11" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Accounts aren&apos;t open yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          OrbitOS is a proof of concept, so there is nothing to sign in to and this page deliberately has no email or password fields. You can explore the full demo
          without an account.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button asChild variant="navy" size="lg">
            <Link href="/demo">
              Explore the live demo <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/waitlist">Join the waitlist</Link>
          </Button>
        </div>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" aria-hidden="true" /> Real authentication is planned for a later phase.
        </p>
      </div>
    </section>
  );
}
