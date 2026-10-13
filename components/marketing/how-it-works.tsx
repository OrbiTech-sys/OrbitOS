"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MODULES, MODULE_BY_SLUG } from "@/lib/content/modules";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/content/site";
import { getInsights } from "@/lib/demo/copilot";
import { CURRENCIES } from "@/lib/demo/format";
import { usd } from "@/lib/demo/format";
import { SEED_DATA } from "@/lib/demo/seed";
import { computeMetrics, customers } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";

const STEPS = ["Choose your business type", "Select the modules you need", "Configure your workspace", "Explore your business dashboard"] as const;
const TEAM_SIZES = ["1–5", "6–20", "21–100", "100+"] as const;

/** Modules that can be toggled in the preview (a subset that has a live demo). */
const SELECTABLE = MODULES.filter((m) => ["crm", "sales", "inventory", "finance", "projects", "analytics", "copilot", "team"].includes(m.slug));

export function HowItWorks() {
  const [step, setStep] = useState(0);
  const [typeId, setTypeId] = useState<string>("wholesale");
  const [modules, setModules] = useState<string[]>(() => BUSINESS_TYPE_OPTIONS.find((b) => b.id === "wholesale")!.modules);
  const [name, setName] = useState("Meridian Workspace Supply");
  const [currency, setCurrency] = useState("USD");
  const [size, setSize] = useState<(typeof TEAM_SIZES)[number]>("6–20");

  const type = BUSINESS_TYPE_OPTIONS.find((b) => b.id === typeId)!;

  function chooseType(id: string) {
    setTypeId(id);
    setModules(BUSINESS_TYPE_OPTIONS.find((b) => b.id === id)!.modules);
  }
  function toggleModule(slug: string) {
    setModules((m) => (m.includes(slug) ? m.filter((x) => x !== slug) : [...m, slug]));
  }

  const canNext = step === 1 ? modules.length > 0 : step === 2 ? name.trim().length > 0 : true;

  return (
    <Section id="how-it-works" labelledBy="how-title">
      <SectionHeading
        id="how-title"
        eyebrow="How it works"
        title="From signing up to seeing your business, in four steps"
        description="This is an interactive preview of the intended onboarding. Nothing is saved or sent: it simply shows how the workspace adapts to your choices."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible [scrollbar-width:none]" aria-label="Onboarding steps">
          {STEPS.map((label, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={label} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                    state === "current" ? "border-primary bg-accent text-accent-foreground" : "border-transparent hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      state === "done" && "border-primary bg-primary text-primary-foreground",
                      state === "current" && "border-primary bg-card text-primary",
                      state === "todo" && "bg-card text-muted-foreground",
                    )}
                  >
                    {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("font-medium whitespace-nowrap lg:whitespace-normal", state === "todo" && "text-muted-foreground")}>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="flex min-h-[30rem] flex-col rounded-2xl border bg-card shadow-card">
          <div className="flex-1 p-5 sm:p-7">
            {step === 0 && (
              <fieldset>
                <legend className="text-lg font-semibold tracking-tight text-foreground">What kind of business do you run?</legend>
                <p className="mt-1 text-sm text-muted-foreground">We use this to suggest a starting set of modules. You can change them next.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {BUSINESS_TYPE_OPTIONS.map((b) => (
                    <label
                      key={b.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                        typeId === b.id ? "border-primary bg-accent/60 ring-1 ring-primary/30" : "hover:bg-muted/60",
                      )}
                    >
                      <input type="radio" name="business-type" className="sr-only" checked={typeId === b.id} onChange={() => chooseType(b.id)} />
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", typeId === b.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Icon name={b.icon} className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{b.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{b.blurb}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="text-lg font-semibold tracking-tight text-foreground">Which modules do you need?</legend>
                <p className="mt-1 text-sm text-muted-foreground">
                  Suggested for <strong className="font-semibold text-foreground">{type.name.toLowerCase()}</strong>. Add or remove anything. Start small, expand later.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {SELECTABLE.map((m) => {
                    const on = modules.includes(m.slug);
                    return (
                      <label
                        key={m.slug}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                          on ? "border-primary bg-accent/60 ring-1 ring-primary/30" : "hover:bg-muted/60",
                        )}
                      >
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleModule(m.slug)} />
                        <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-foreground">{m.name}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{m.tagline}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                {modules.length === 0 && <p role="alert" className="mt-3 text-sm text-danger">Choose at least one module to continue.</p>}
              </fieldset>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Configure your workspace</h3>
                <p className="mt-1 text-sm text-muted-foreground">Basic details only. Everything stays in this preview.</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ws-name">Business name</Label>
                    <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={name.trim().length === 0} aria-describedby="ws-name-help" />
                    <p id="ws-name-help" className={cn("text-xs", name.trim().length === 0 ? "text-danger" : "text-muted-foreground")}>
                      {name.trim().length === 0 ? "Please enter a business name." : "Shown in the workspace header."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ws-currency">Preferred currency</Label>
                    <select
                      id="ws-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-sm leading-none font-medium">Team size</legend>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_SIZES.map((s) => (
                        <label
                          key={s}
                          className={cn(
                            "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                            size === s ? "border-primary bg-accent text-accent-foreground" : "bg-card text-foreground/80 hover:bg-muted",
                          )}
                        >
                          <input type="radio" name="team-size" className="sr-only" checked={size === s} onChange={() => setSize(s)} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            )}

            {step === 3 && <DashboardPreview name={name.trim() || "Your business"} modules={modules} currency={currency} size={size} />}
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3.5 sm:px-7">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue <ArrowRight />
              </Button>
            ) : (
              <Button asChild variant="navy">
                <Link href="/demo">
                  Open the live demo <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

function DashboardPreview({ name, modules, currency, size }: { name: string; modules: string[]; currency: string; size: string }) {
  const m = useMemo(() => computeMetrics(SEED_DATA), []);
  const tiles = useMemo(() => {
    const all: Record<string, { label: string; value: string; hint: string }> = {
      crm: { label: "Open opportunities", value: String(m.openOppCount), hint: `${usd.compact(m.openOppValue)} pipeline` },
      sales: { label: "Revenue this month", value: usd.compact(m.revenueMonth), hint: `${m.ordersMonth} orders` },
      inventory: { label: "Low-stock products", value: String(m.lowStockCount), hint: "below threshold" },
      finance: { label: "Outstanding invoices", value: usd.compact(m.outstandingTotal), hint: `${m.overdueCount} overdue` },
      projects: { label: "Tasks due today", value: String(m.tasksDueToday), hint: `${m.tasksOverdue} overdue` },
      team: { label: "Team members", value: String(SEED_DATA.team.length), hint: "in sample data" },
      analytics: { label: "Customers", value: String(customers(SEED_DATA).length), hint: "in sample data" },
      copilot: { label: "Insights today", value: String(getInsights(SEED_DATA).length), hint: "from the demo assistant" },
    };
    return modules.map((slug) => all[slug]).filter(Boolean);
  }, [m, modules]);

  return (
    <div>
      <h3 className="text-lg font-semibold tracking-tight text-foreground">Your workspace is ready to explore</h3>
      <p className="mt-1 text-sm text-muted-foreground">A preview of the dashboard built from your choices, shown with illustrative sample data.</p>
      <div className="mt-5 overflow-hidden rounded-xl border bg-muted/50 shadow-card">
        <div className="flex">
          <aside className="hidden w-44 shrink-0 bg-sidebar p-3 text-sidebar-foreground sm:block" aria-label="Preview sidebar">
            <div className="flex items-center gap-2 px-1 pb-3">
              <LogoMark className="size-6" inverse />
              <span className="truncate text-xs font-semibold text-white">{name}</span>
            </div>
            <ul className="space-y-0.5 text-xs">
              <li className="rounded-md bg-sidebar-accent px-2 py-1.5 font-medium text-white">Overview</li>
              {modules.map((slug) => (
                <li key={slug} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <Icon name={MODULE_BY_SLUG[slug].icon} className="size-3.5 opacity-80" />
                  <span className="truncate">{MODULE_BY_SLUG[slug].name}</span>
                </li>
              ))}
            </ul>
          </aside>
          <div className="min-w-0 flex-1 p-4">
            <p className="text-xs text-muted-foreground">
              {name} · {currency} · team of {size}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-lg border bg-card p-3 shadow-card">
                  <p className="truncate text-[0.6875rem] font-medium text-muted-foreground">{t.label}</p>
                  <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums text-foreground">{t.value}</p>
                  <p className="truncate text-[0.6875rem] text-muted-foreground">{t.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
