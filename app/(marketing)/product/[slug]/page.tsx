import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Info } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { StatusBadge } from "@/components/shared/badges";
import { Icon } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { INDUSTRIES } from "@/lib/content/industries";
import { MODULES, MODULE_BY_SLUG } from "@/lib/content/modules";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const m = MODULE_BY_SLUG[slug];
  return m ? { title: m.name, description: `${m.tagline}. ${m.benefit}` } : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const m = MODULE_BY_SLUG[slug];
  if (!m) notFound();

  const related = MODULES.filter((x) => x.slug !== m.slug).slice(0, 4);
  const industries = INDUSTRIES.filter((i) => i.modules.includes(m.slug));

  return (
    <>
      <PageHero
        eyebrow="Product module"
        title={m.name}
        description={m.tagline}
        crumbs={[{ href: "/#modules", label: "Product" }, { label: m.name }]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone={m.availability === "Interactive demo" ? "success" : m.availability === "Concept preview" ? "info" : "neutral"}>{m.availability}</StatusBadge>
          {m.demoHref && (
            <Button asChild variant="navy" size="lg">
              <Link href={m.demoHref}>
                Open {m.name} in the live demo <ArrowRight />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/waitlist">Join the waitlist</Link>
          </Button>
        </div>
      </PageHero>

      <Section className="py-16 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border bg-card p-7 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Icon name="alert" className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">The problem</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{m.problem}</p>
          </article>
          <article className="rounded-2xl border bg-card p-7 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon name={m.icon} className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">What it does</h2>
            <ul className="mt-3 space-y-2.5">
              {m.functionality.map((f) => (
                <li key={f} className="flex gap-2.5 text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border bg-card p-7 shadow-card">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success-soft text-success">
              <Icon name="target" className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">The benefit</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{m.benefit}</p>
          </article>
        </div>

        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-dashed bg-muted/60 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-foreground">In this proof of concept:</strong> {m.pocNote}
          </span>
        </p>

        {industries.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-semibold tracking-tight">Used most in</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {industries.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={`/industries/${i.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium shadow-card outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Icon name={i.icon} className="size-3.5 text-primary" />
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight">Works with other modules</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/product/${r.slug}`}
                  className="group flex h-full items-start gap-3 rounded-xl border bg-card p-4 shadow-card outline-none transition-shadow hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon name={r.icon} className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{r.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{r.tagline}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
