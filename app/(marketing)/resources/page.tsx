import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { StatusBadge } from "@/components/shared/badges";
import { getSiteContent } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  const { resources } = await getSiteContent();
  return { title: resources.eyebrow || "Resources", description: resources.description };
}

export default async function ResourcesPage() {
  const { resources } = await getSiteContent();
  const { guide, roadmap } = resources;

  return (
    <>
      <PageHero eyebrow={resources.eyebrow} title={resources.title} description={resources.description} crumbs={[{ label: resources.eyebrow || "Resources" }]} />
      <Section className="py-14 sm:py-20">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {resources.items.map((r) => (
            <li key={r.title}>
              <Link
                href={r.href}
                className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card outline-none transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon name={r.icon} className="size-5" />
                  </span>
                  <StatusBadge tone={r.status === "Available" ? "success" : "info"}>{r.status}</StatusBadge>
                </div>
                <h2 className="mt-4 text-base font-semibold">{r.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                  Open <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {guide.visible && (
          <div id="demo-guide" className="mt-20 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">{guide.title}</h2>
            {guide.body && <p className="mt-2 max-w-2xl text-muted-foreground">{guide.body}</p>}
            <ol className="mt-6 grid gap-4 md:grid-cols-2">
              {guide.steps.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">{i + 1}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {guide.linkLabel && guide.linkHref && (
              <Link href={guide.linkHref} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                {guide.linkLabel} <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        {roadmap.visible && (
          <div id="roadmap" className="mt-20 scroll-mt-24 rounded-2xl border bg-muted/50 p-7">
            <h2 className="text-2xl font-semibold tracking-tight">{roadmap.title}</h2>
            {roadmap.body && <p className="mt-2 max-w-2xl text-muted-foreground">{roadmap.body}</p>}
            <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
              {roadmap.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        )}
      </Section>
    </>
  );
}
