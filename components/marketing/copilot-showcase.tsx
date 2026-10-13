"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, ShieldQuestion, Sparkles } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { CopilotChat } from "@/components/shared/copilot-chat";
import { Button } from "@/components/ui/button";
import { SEED_DATA } from "@/lib/demo/seed";

const POINTS = [
  { icon: Database, title: "Grounded in your records", body: "Answers are computed from the same orders, invoices, products and tasks you see in the modules." },
  { icon: Sparkles, title: "Built for action", body: "Every answer links to the record, so the next step is one click away." },
  { icon: ShieldQuestion, title: "Honest about what it is", body: "This is a deterministic demo assistant that runs locally. It does not call an AI model, and it only handles the supported questions." },
];

export function CopilotShowcase() {
  return (
    <Section id="copilot" labelledBy="copilot-title" tone="dark" className="overflow-hidden">
      <div className="bg-grid-dark pointer-events-none absolute inset-x-0 top-0 h-full opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
      <div className="relative grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            id="copilot-title"
            align="left"
            inverse
            eyebrow="AI copilot (demo)"
            title="Know what needs attention. Know what to do next."
            description="Ask in plain language. The copilot looks across the records in your workspace and answers with the specifics: which invoice, which product, which lead."
          />
          <ul className="mt-8 space-y-5">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200 ring-1 ring-white/15">
                  <p.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-navy-200">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-8 space-y-2 text-sm text-navy-200">
            {["What needs my attention today?", "Which invoices are overdue?", "Which products are running low?"].map((q) => (
              <li key={q} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-indigo-300" aria-hidden="true" /> “{q}”
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-9 bg-white text-navy-900 hover:bg-slate-100">
            <Link href="/demo/copilot">
              Open the copilot in the live demo <ArrowRight />
            </Link>
          </Button>
        </div>

        <CopilotChat data={SEED_DATA} height="h-[36rem]" className="border-white/10 shadow-float" />
      </div>
    </Section>
  );
}
