"use client";

import { Database, Info, Quote } from "lucide-react";

import { useRecordNav } from "@/components/demo/use-record-nav";
import { Card, DemoNotice, PageHeader } from "@/components/demo/ui";
import { CopilotChat } from "@/components/shared/copilot-chat";
import { SUGGESTED_PROMPTS } from "@/lib/demo/copilot";
import { useMoney } from "@/lib/demo/settings";
import { useDemoData } from "@/lib/demo/store";

export function CopilotView() {
  const data = useDemoData();
  const money = useMoney();
  const openRecord = useRecordNav();

  const sources = [
    { label: "Contacts", n: data.contacts.length },
    { label: "Orders", n: data.orders.length },
    { label: "Invoices", n: data.invoices.length },
    { label: "Quotations", n: data.quotations.length },
    { label: "Products", n: data.products.length },
    { label: "Tasks", n: data.tasks.length },
    { label: "Expenses", n: data.expenses.length },
  ];

  return (
    <>
      <PageHeader title="AI Copilot" description="Ask about your business in plain language. Answers are built from the live records in this workspace, with links to act on them." />
      <DemoNotice className="mb-6">
        <strong>Demo assistant.</strong> It is deterministic and rule-based, runs entirely in your browser and calls no AI service. It understands the suggested questions and close variations of them.
      </DemoNotice>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <CopilotChat data={data} money={money} onOpenRecord={openRecord} height="h-[calc(100dvh-17rem)] min-h-[34rem]" />

        <aside className="space-y-6" aria-label="About the assistant">
          <Card title="What it can read" description="Live records, so answers change when you do">
            <ul className="space-y-2">
              {sources.map((s) => (
                <li key={s.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Database className="size-3.5" aria-hidden="true" />
                    {s.label}
                  </span>
                  <span className="font-semibold tabular-nums">{s.n}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Questions it understands">
            <ul className="space-y-2">
              {SUGGESTED_PROMPTS.map((q) => (
                <li key={q} className="flex gap-2 text-sm text-muted-foreground">
                  <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {q}
                </li>
              ))}
            </ul>
          </Card>
          <p className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Try changing something first, for example adjusting stock in Inventory or marking an invoice as paid, then ask again to see the answer change.
          </p>
        </aside>
      </div>
    </>
  );
}
