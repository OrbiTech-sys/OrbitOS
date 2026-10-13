import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { StatusBadge } from "@/components/shared/badges";
import { MODULES, type Availability } from "@/lib/content/modules";

const AVAILABILITY_TONE: Record<Availability, "success" | "info" | "neutral"> = {
  "Interactive demo": "success",
  "Concept preview": "info",
  Planned: "neutral",
};

export function Features() {
  return (
    <Section id="modules" labelledBy="modules-title">
      <SectionHeading
        id="modules-title"
        eyebrow="Modules"
        title="Start with what you need. Expand when you're ready."
        description="Ten building blocks that share one set of records. A small agency can begin with CRM, projects and invoicing; a retailer with sales and inventory."
      />
      <ul className="mt-14 grid gap-5 md:grid-cols-2">
        {MODULES.map((m, i) => (
          <li key={m.slug}>
            <Reveal delay={(i % 2) * 0.06} className="h-full">
              <article className="group/card flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-elevated">
                <header className="flex items-start gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover/card:bg-primary group-hover/card:text-primary-foreground">
                    <Icon name={m.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{m.name}</h3>
                      <StatusBadge tone={AVAILABILITY_TONE[m.availability]}>{m.availability}</StatusBadge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{m.tagline}</p>
                  </div>
                </header>

                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-danger uppercase">The problem</dt>
                    <dd className="mt-1 leading-relaxed text-foreground/80">{m.problem}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-primary uppercase">What it does</dt>
                    <dd className="mt-1.5">
                      <ul className="space-y-1.5">
                        {m.functionality.slice(0, 3).map((f) => (
                          <li key={f} className="flex gap-2 leading-snug text-foreground/80">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wider text-success uppercase">The benefit</dt>
                    <dd className="mt-1 leading-relaxed text-foreground/80">{m.benefit}</dd>
                  </div>
                </dl>

                <footer className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-sm font-medium">
                  <Link
                    href={`/product/${m.slug}`}
                    className="inline-flex items-center gap-1 rounded text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    About {m.name} <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  {m.demoHref && (
                    <Link
                      href={m.demoHref}
                      className="inline-flex items-center gap-1 rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      Try it in the demo
                    </Link>
                  )}
                </footer>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
