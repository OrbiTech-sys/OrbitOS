"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * The catch-all for anything that fails to render, including the workspace's layout,
 * which its own error page can't cover. Offers a retry and always a way out.
 */
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div role="alert" className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
        <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your data is safe. This is usually a short connection problem; try again in a moment.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="navy" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to the website</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
