"use client";

import { Button } from "@/components/ui/button";

/** Shown when a member's workspace can't be loaded (for example the database is unreachable). */
export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div role="alert" className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold tracking-tight">We couldn&apos;t load your workspace</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your data is safe. This is usually a short connection problem; try again in a moment.</p>
        <Button className="mt-6" variant="navy" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
