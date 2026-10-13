import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { MODULE_BY_SLUG } from "@/lib/content/modules";
import { SOLUTIONS, SOLUTION_BY_SLUG } from "@/lib/content/site";

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/solutions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const s = SOLUTION_BY_SLUG[slug];
  return s ? { title: s.name, description: s.description } : {};
}

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const { slug } = await params;
  const s = SOLUTION_BY_SLUG[slug];
  if (!s) notFound();

  return (
    <>
      <PageHero eyebrow="Solution" title={s.headline} description={s.description} crumbs={[{ label: "Solutions" }, { label: s.name }]}>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="navy" size="lg">
            <Link href={s.demoHref}>
              See it in the live demo <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/waitlist">Join the waitlist</Link>
          </Button>
        </div>
      </PageHero>
      <Section className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">What changes</h2>
            <ul className="mt-5 space-y-3.5">
              {s.outcomes.map((o) => (
                <li key={o} className="flex gap-3 text-base leading-relaxed text-muted-foreground">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Modules involved</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {s.modules.map((slug) => {
                const m = MODULE_BY_SLUG[slug];
                return (
                  <li key={slug}>
                    <Link
                      href={`/product/${slug}`}
                      className="flex h-full items-start gap-3 rounded-xl border bg-card p-4 shadow-card outline-none transition-shadow hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <Icon name={m.icon} className="size-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{m.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{m.tagline}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <p className="mt-12 max-w-2xl text-sm text-muted-foreground">
          This page describes the intended direction for OrbitOS. The linked demo shows what exists in the proof of concept; nothing here is a commercial service yet.
        </p>
      </Section>
    </>
  );
}
