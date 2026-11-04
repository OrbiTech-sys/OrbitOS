import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { bySlug } from "@/lib/content/published";
import { getSiteContent } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  const { home } = await getSiteContent();
  return { title: "Industries", description: home.industries.description };
}

export default async function IndustriesPage() {
  const { home, industries, modules } = await getSiteContent();
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title={home.industries.title}
        description={home.industries.description}
        crumbs={[{ label: "Industries" }]}
      />
      <Section className="py-16 sm:py-20">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((i) => (
            <li key={i.slug}>
              <Link
                href={`/industries/${i.slug}`}
                className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card outline-none transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={i.icon} className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">{i.name}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{i.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {i.modules.slice(0, 4).map((slug) => (
                    <li key={slug} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {bySlug(modules, slug)?.name}
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-primary">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
