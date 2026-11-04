"use client";

import { useMemo, useState, useTransition } from "react";
import { Inbox, Loader2, Mail, RotateCcw, Trash2, CheckCheck } from "lucide-react";

import { StatusBadge } from "@/components/shared/badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteSubmission, setSubmissionHandled, type InboxResult } from "@/lib/marketing/inbox-actions";
import type { Submission } from "@/lib/marketing/inbox";

const received = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

type Filter = "new" | "handled" | "all";

/** Settings → Inbox: what visitors have sent through the website's contact and access-request forms. */
export function InboxPanel({ submissions, error }: { submissions: Submission[]; error: string | null }) {
  const [filter, setFilter] = useState<Filter>("new");
  const [confirming, setConfirming] = useState<Submission | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => ({ new: submissions.filter((s) => s.status === "new").length, handled: submissions.filter((s) => s.status === "handled").length, all: submissions.length }), [submissions]);
  const visible = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  function run(action: () => Promise<InboxResult>, after?: () => void) {
    setFailure(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) after?.();
      else setFailure(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Inbox</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Messages and access requests sent through the website. Only administrators can see these. Reply by email; OrbitOS doesn&apos;t send mail itself.</p>
      </div>

      {(error || failure) && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {failure ?? `The inbox couldn't be loaded: ${error}`}
        </p>
      )}

      <div role="group" aria-label="Filter messages" className="flex flex-wrap gap-1.5">
        {(["new", "handled", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium capitalize outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 " +
              (filter === f ? "border-navy-900 bg-navy-900 text-white dark:border-primary dark:bg-primary" : "bg-card text-foreground/80 hover:bg-muted")
            }
          >
            {f}
            <span className={"rounded-full px-1.5 text-[0.6875rem] tabular-nums " + (filter === f ? "bg-white/20" : "bg-muted text-muted-foreground")}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <section className="flex flex-col items-center rounded-2xl border bg-card px-6 py-14 text-center shadow-card">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Inbox className="size-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-sm font-semibold">{submissions.length === 0 ? "Nothing here yet" : "Nothing in this view"}</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{submissions.length === 0 ? "When someone uses the contact or access-request form, it appears here." : "Try another filter."}</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => (
            <li key={s.id}>
              <article className="rounded-2xl border bg-card p-5 shadow-card">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {s.name}
                      <StatusBadge tone={s.kind === "waitlist" ? "primary" : "info"}>{s.kind === "waitlist" ? "Access request" : "Message"}</StatusBadge>
                      {s.status === "handled" && <StatusBadge tone="neutral">Handled</StatusBadge>}
                    </h3>
                    <a href={`mailto:${s.email}`} className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <Mail className="size-3.5" aria-hidden="true" /> {s.email}
                    </a>
                  </div>
                  <time dateTime={s.created_at} className="shrink-0 text-xs text-muted-foreground">
                    {received.format(new Date(s.created_at))}
                  </time>
                </header>
                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  {s.company && (
                    <div className="flex gap-1.5">
                      <dt>Company:</dt>
                      <dd className="font-medium text-foreground">{s.company}</dd>
                    </div>
                  )}
                  {s.topic && (
                    <div className="flex gap-1.5">
                      <dt>{s.kind === "waitlist" ? "Business:" : "Topic:"}</dt>
                      <dd className="font-medium text-foreground">{s.topic}</dd>
                    </div>
                  )}
                  {s.team_size && (
                    <div className="flex gap-1.5">
                      <dt>Team:</dt>
                      <dd className="font-medium text-foreground">{s.team_size}</dd>
                    </div>
                  )}
                </dl>
                {s.message && <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground/85">{s.message}</p>}
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                  {s.status === "new" ? (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setSubmissionHandled(s.id, true))}>
                      <CheckCheck /> Mark handled
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setSubmissionHandled(s.id, false))}>
                      <RotateCcw /> Move back to new
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger" disabled={pending} onClick={() => setConfirming(s)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
            <DialogDescription>
              This permanently removes what {confirming?.name} sent. It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => confirming && run(() => deleteSubmission(confirming.id), () => setConfirming(null))}
            >
              {pending && <Loader2 className="animate-spin" />} Delete message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
