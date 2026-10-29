"use client";

import { Link } from "@/components/demo/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUp, Sparkles } from "lucide-react";

import { useRecordNav } from "@/components/demo/use-record-nav";
import { AnswerView } from "@/components/shared/copilot-chat";
import { Button } from "@/components/ui/button";
import { SUGGESTED_PROMPTS, answerQuestion, getInsights, type CopilotAnswer } from "@/lib/demo/copilot";
import { useMoney } from "@/lib/demo/settings";
import { useDemoData } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useIsDemo, useToday } from "@/lib/workspace/context";

const DOT = { danger: "bg-danger", warning: "bg-warning", success: "bg-success", info: "bg-info", neutral: "bg-muted-foreground/40" } as const;

/** Compact, contextual assistant for the dashboard: proactive insights plus quick questions. */
export function InsightsPanel({ className }: { className?: string }) {
  const data = useDemoData();
  const money = useMoney();
  const today = useToday();
  const demo = useIsDemo();
  const openRecord = useRecordNav();
  const insights = useMemo(() => getInsights(data, { money, today }), [data, money, today]);
  const [answer, setAnswer] = useState<{ q: string; a: CopilotAnswer } | null>(null);
  const [input, setInput] = useState("");

  function ask(q: string) {
    const text = q.trim();
    if (!text) return;
    setAnswer({ q: text, a: answerQuestion(text, data, { money, today, demo }) });
    setInput("");
  }

  return (
    <section aria-labelledby="insights-title" className={cn("flex flex-col rounded-2xl border bg-card shadow-card", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="insights-title" className="text-sm leading-none font-semibold">
              AI insights
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{demo ? "Demo assistant · from your sample data" : "Assistant · from your own records"}</p>
          </div>
        </div>
        <Link href="/demo/copilot" className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">
          Open copilot <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>

      <ul className="space-y-1 px-3">
        {insights.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              onClick={() => (i.record ? openRecord(i.record, i.action.href) : undefined)}
              className="group/insight flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[i.tone])} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[0.8125rem] leading-snug font-semibold text-foreground">{i.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{i.detail}</span>
                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {i.action.label} <ArrowRight className="size-3 transition-transform group-hover/insight:translate-x-0.5" aria-hidden="true" />
                </span>
              </span>
            </button>
          </li>
        ))}
        {insights.length === 0 && <li className="px-2.5 py-4 text-sm text-muted-foreground">Nothing needs attention right now. Nice work.</li>}
      </ul>

      <div className="mt-auto border-t px-5 py-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Ask a quick question</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-full border bg-card px-2.5 py-1 text-left text-xs font-medium text-foreground/80 outline-none transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <label htmlFor="insight-input" className="sr-only">
            {demo ? "Ask the demo assistant" : "Ask the assistant"}
          </label>
          <input
            id="insight-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Which invoices are overdue?"
            autoComplete="off"
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <Button type="submit" size="icon" aria-label="Ask" disabled={!input.trim()}>
            <ArrowUp />
          </Button>
        </form>

        {answer && (
          <div role="region" aria-live="polite" aria-label="Assistant answer" className="mt-4 rounded-xl border bg-muted/40 p-3.5">
            <p className="mb-2 text-xs text-muted-foreground">You asked: “{answer.q}”</p>
            <div className="scrollbar-thin max-h-72 overflow-y-auto pr-1">
              <AnswerView answer={answer.a} onOpenRecord={openRecord} onAsk={ask} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
