"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, type IndustryContent } from "@/lib/content/industries";
import { MODULE_BY_SLUG } from "@/lib/content/modules";
import { cn } from "@/lib/utils";

/** Reusable detail view, also used on /industries/[slug]. */
export function IndustryDetail({ industry, compact = false }: { industry: IndustryContent; compact?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={cn("font-semibold tracking-tight text-foreground", compact ? "text-xl" : "text-2xl")}>{industry.name}</h3>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">{industry.summary}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Typical use cases</h4>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {industry.useCases.map((u) => (
            <li key={u.title} className="rounded-xl border bg-card p-4 shadow-card">
              <p className="text-sm font-semibold text-foreground">{u.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{u.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Recommended modules</h4>
        <ul className="mt-3 flex flex-wrap gap-2">
          {industry.modules.map((slug) => {
            const m = MODULE_BY_SLUG[slug];
            return (
              <li key={slug}>
                <Link
                  href={`/product/${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-card outline-none transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Icon name={m.icon} className="size-3.5 text-primary" />
                  {m.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">An illustrative flow</h4>
        <ol className="mt-3 flex flex-wrap items-center gap-2">
          {industry.workflow.map((w, i) => (
            <li key={w} className="flex items-center gap-2">
              <span className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-primary">{w}</span>
              {i < industry.workflow.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-dashed bg-muted/60 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-foreground">Honest status:</strong> {industry.note}
        </span>
      </p>
    </div>
  );
}

export function IndustriesSection() {
  const [selected, setSelected] = useState(INDUSTRIES[0].slug);
  const industry = INDUSTRIES.find((i) => i.slug === selected) ?? INDUSTRIES[0];

  return (
    <Section id="industries" labelledBy="industries-title" tone="muted">
      <SectionHeading
        id="industries-title"
        eyebrow="Industry solutions"
        title="The same core, shaped around how you work"
        description="Pick an industry to see typical use cases and which modules fit. Deep, industry-specific processes will arrive progressively, and this page says plainly where they are not built yet."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-[17rem_1fr]">
        <div
          role="radiogroup"
          aria-label="Choose an industry"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible [scrollbar-width:none]"
        >
          {INDUSTRIES.map((i) => {
            const active = i.slug === selected;
            return (
              <button
                key={i.slug}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(i.slug)}
                onKeyDown={(e) => {
                  const idx = INDUSTRIES.findIndex((x) => x.slug === selected);
                  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                    e.preventDefault();
                    setSelected(INDUSTRIES[(idx + 1) % INDUSTRIES.length].slug);
                  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    setSelected(INDUSTRIES[(idx - 1 + INDUSTRIES.length) % INDUSTRIES.length].slug);
                  }
                }}
                tabIndex={active ? 0 : -1}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-full",
                  active ? "border-primary bg-card text-foreground shadow-elevated ring-1 ring-primary/20" : "bg-card/60 text-foreground/75 hover:border-input hover:bg-card",
                )}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon name={i.icon} className="size-4" />
                </span>
                <span className="whitespace-nowrap lg:whitespace-normal">{i.name}</span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8" aria-live="polite">
          <IndustryDetail key={industry.slug} industry={industry} compact />
          <div className="mt-6 flex flex-wrap gap-3 border-t pt-6">
            <Button asChild variant="navy">
              <Link href={`/industries/${industry.slug}`}>
                More on {industry.name.split(" and ")[0].toLowerCase()} <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/demo">Explore the live demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
