import type { Metadata } from "next";
import { UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Account deactivated" };

/** Where requireUser() sends a deactivated account. Static: it reveals nothing about the account. */
export default function DeactivatedPage() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-card p-7 text-center shadow-card">
      <UserX className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold tracking-tight">This account has been deactivated</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Contact your administrator if you think this is a mistake.</p>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="navy" className="w-full">
          Sign out
        </Button>
      </form>
    </section>
  );
}
