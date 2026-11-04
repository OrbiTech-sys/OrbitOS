import { ArrowDown } from "lucide-react";

import { Icon } from "@/components/shared/icon";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Reveal } from "@/components/marketing/reveal";
import type { HomeContent } from "@/lib/content/schema";

export function PainPoints({ section }: { section: HomeContent["problems"] }) {
  return (
    <Section id="problems" labelledBy="problems-title" tone="muted">
      <SectionHeading id="problems-title" eyebrow={section.eyebrow} title={section.title} description={section.description} />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {section.items.map((p, i) => (
          <li key={p.title}>
            <Reveal delay={(i % 3) * 0.06} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow duration-200 hover:shadow-elevated">
                <div className="p-6 pb-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <Icon name={p.icon} className="size-5" />
                  </div>
                  <h3 className="mt-4 text-lg leading-snug font-semibold tracking-tight text-foreground">{p.title}</h3>
                  <p className="mt-3 text-xs font-semibold tracking-wider text-danger uppercase">What it costs you</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.consequence}</p>
                </div>
                <div className="relative mt-auto border-t bg-accent/60 p-6 pt-5">
                  <span className="absolute -top-3 left-6 flex size-6 items-center justify-center rounded-full border bg-card text-primary shadow-card">
                    <ArrowDown className="size-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-xs font-semibold tracking-wider text-primary uppercase">{section.solutionLabel}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{p.solution}</p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
