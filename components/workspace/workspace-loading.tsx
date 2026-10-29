import { LogoMark } from "@/components/shared/logo";

/** Shown while a member's workspace loads from the database. */
export function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-muted/40" role="status" aria-label="Loading your workspace">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-sidebar lg:block" aria-hidden="true" />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <div className="flex h-16 items-center gap-3 border-b bg-background px-4 sm:px-6" aria-hidden="true">
          <LogoMark className="size-8 lg:hidden" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="mx-auto w-full max-w-[90rem] flex-1 space-y-4 px-4 py-8 sm:px-6 lg:px-8" aria-hidden="true">
          <div className="h-8 w-64 animate-pulse rounded bg-card" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-card" />
        </div>
      </div>
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}
