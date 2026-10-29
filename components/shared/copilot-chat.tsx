"use client";

import { Link } from "@/components/demo/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, Info, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SUGGESTED_PROMPTS, answerQuestion, type AnswerBlock, type AnswerItem, type CopilotAnswer, type Tone } from "@/lib/demo/copilot";
import type { MoneyFormatter } from "@/lib/demo/format";
import type { DemoData, RecordRef } from "@/lib/demo/types";
import { useIsDemo, useToday } from "@/lib/workspace/context";
import { cn } from "@/lib/utils";

const DOT: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  info: "bg-info",
  neutral: "bg-muted-foreground/40",
};

const STAT_TONE: Record<Tone, string> = {
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  neutral: "text-foreground",
};

export type OpenRecordHandler = (record: RecordRef, href: string) => void;

/* ---------------------------------------------------------- Answer view --- */

function ListItem({ item, onOpenRecord }: { item: AnswerItem; onOpenRecord?: OpenRecordHandler }) {
  const body = (
    <>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[item.tone ?? "neutral"])} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm leading-snug font-medium text-foreground">{item.primary}</span>
        {item.secondary && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.secondary}</span>}
      </span>
      {item.meta && <span className="shrink-0 pl-2 text-sm font-semibold tabular-nums text-foreground">{item.meta}</span>}
      {(item.href || item.record) && <ArrowRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover/item:translate-x-0.5" aria-hidden="true" />}
    </>
  );
  const cls =
    "group/item flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
  if (item.record && item.href && onOpenRecord) {
    return (
      <button type="button" className={cls} onClick={() => onOpenRecord(item.record!, item.href!)}>
        {body}
      </button>
    );
  }
  if (item.href) {
    return (
      <Link href={item.href} className={cls}>
        {body}
      </Link>
    );
  }
  return <div className={cn(cls, "hover:bg-transparent")}>{body}</div>;
}

function Block({ block, onOpenRecord, onAsk }: { block: AnswerBlock; onOpenRecord?: OpenRecordHandler; onAsk?: (q: string) => void }) {
  if (block.type === "text") return <p className="text-sm leading-relaxed text-foreground/85">{block.text}</p>;
  if (block.type === "stats") {
    return (
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {block.items.map((s) => (
          <div key={s.label} className="rounded-lg border bg-muted/50 px-3 py-2">
            <dt className="text-[0.6875rem] font-medium text-muted-foreground">{s.label}</dt>
            <dd className={cn("mt-0.5 text-lg leading-tight font-semibold tracking-tight tabular-nums", STAT_TONE[s.tone ?? "neutral"])}>{s.value}</dd>
            {s.hint && <p className="text-[0.6875rem] text-muted-foreground">{s.hint}</p>}
          </div>
        ))}
      </dl>
    );
  }
  return (
    <div>
      {block.title && <p className="mb-1 px-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{block.title}</p>}
      <ul className="-mx-0.5 divide-y divide-border/60 rounded-xl border bg-card">
        {block.items.map((item, i) => (
          <li key={`${item.primary}-${i}`}>
            {onAsk && !item.href && !item.record ? (
              <button type="button" onClick={() => onAsk(item.primary)} className="group/item flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
                {item.primary}
              </button>
            ) : (
              <ListItem item={item} onOpenRecord={onOpenRecord} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnswerView({
  answer,
  onOpenRecord,
  onAsk,
}: {
  answer: CopilotAnswer;
  onOpenRecord?: OpenRecordHandler;
  onAsk?: (q: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold tracking-tight text-foreground">{answer.title}</p>
      {answer.blocks.map((b, i) => (
        <Block key={i} block={b} onOpenRecord={onOpenRecord} onAsk={onAsk} />
      ))}
      {answer.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {answer.actions.map((a) => (
            <Button key={a.href + a.label} asChild variant="soft" size="sm">
              <Link href={a.href}>
                {a.label} <ArrowRight />
              </Link>
            </Button>
          ))}
        </div>
      )}
      {answer.followUps.length > 0 && onAsk && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground">Also try:</span>
          {answer.followUps.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAsk(q)}
              className="rounded-full border bg-card px-2.5 py-1 text-xs font-medium text-foreground/80 outline-none transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Chat --- */

interface Turn {
  id: number;
  question: string;
  answer: CopilotAnswer;
}

export function CopilotChat({
  data,
  money,
  onOpenRecord,
  className,
  height = "h-[34rem]",
}: {
  data: DemoData;
  money?: MoneyFormatter;
  onOpenRecord?: OpenRecordHandler;
  className?: string;
  /** Tailwind height class for the whole panel. */
  height?: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const nextId = useRef(1);
  const today = useToday();
  const demo = useIsDemo();

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || pending) return;
    setInput("");
    setPending(text);
    // A short pause so the exchange feels like a conversation. Answers are computed locally.
    timer.current = window.setTimeout(() => {
      const answer = answerQuestion(text, data, { money, today, demo });
      const id = nextId.current++;
      setTurns((t) => [...t, { id, question: text, answer }]);
      setPending(null);
    }, 380);
  }

  return (
    <section aria-label={demo ? "AI copilot demo" : "Business assistant"} className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card shadow-elevated", height, className)}>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm leading-none font-semibold text-foreground">OrbitOS Copilot</h3>
          <p className="mt-1 text-xs text-muted-foreground">{demo ? "Demo assistant · reads the sample data in this workspace" : "Assistant · reads your own records"}</p>
        </div>
        <span className="ml-auto hidden rounded-full border border-dashed border-input px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground sm:inline">
          No AI model is called
        </span>
      </header>

      <div ref={scroller} role="log" aria-live="polite" aria-label="Conversation" className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm leading-relaxed text-foreground/85">
              {demo ? (
                <>
                  Hi! I&apos;m a <strong>demo assistant</strong>. I answer a set of business questions by reading the sample records in this workspace, so every answer
                  matches what you see in the modules. Pick a question or type your own.
                </>
              ) : (
                <>
                  Hi! I&apos;m a <strong>rule-based assistant</strong>. I answer a set of business questions by reading your own records, so every answer matches what you
                  see in the modules. Pick a question or type your own.
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={!!pending}
                  onClick={() => ask(q)}
                  className="rounded-full border bg-card px-3 py-1.5 text-left text-xs font-medium text-foreground/85 shadow-card outline-none transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {turns.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 px-3.5 py-2 text-sm text-white dark:bg-primary">{t.question}</p>
            </div>
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <AnswerView answer={t.answer} onOpenRecord={onOpenRecord} onAsk={ask} />
              </div>
            </div>
          </motion.div>
        ))}

        {pending && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 px-3.5 py-2 text-sm text-white dark:bg-primary">{pending}</p>
            </div>
            <div className="flex items-center gap-3" role="status">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Sparkles className="size-3.5" aria-hidden="true" />
              </span>
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted-foreground/50" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
              <span className="sr-only">Looking through your records…</span>
            </div>
          </div>
        )}
      </div>

      <form
        className="border-t bg-muted/40 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="copilot-input" className="sr-only">
            {demo ? "Ask the demo assistant a question" : "Ask the assistant a question"}
          </label>
          <input
            id="copilot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about invoices, stock, leads, tasks or sales…"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm shadow-card outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <Button type="submit" size="icon-lg" aria-label="Send question" disabled={!input.trim() || !!pending} className="rounded-xl">
            <ArrowUp />
          </Button>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
          <Info className="size-3 shrink-0" aria-hidden="true" />
          {demo
            ? "Deterministic demo: it understands the six suggested questions and a few related ones, using only the sample dataset."
            : "Rule-based: it understands the six suggested questions and a few related ones, using only your own records. No AI model is called."}
        </p>
      </form>
    </section>
  );
}
