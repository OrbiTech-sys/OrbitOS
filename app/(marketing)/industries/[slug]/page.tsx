import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { IndustryDetail } from "@/components/marketing/industries-section";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { DEFAULT_CONTENT } from "@/lib/content/defaults";
import { bySlug } from "@/lib/content/published";
import { getSiteContent } from "@/lib/content/store";

// New pages can be added in the Website editor after a build, so an address that wasn't
// prerendered is rendered on request. It may block for that first visit, which also lets
// an unknown address return a real 404.
export const instant = false;

/** Always includes the built-in slugs, so a build never ends up with nothing to prerender. */
export async function generateStaticParams() {
  const { industries } = await getSiteContent();
  const slugs = new Set([...industries, ...DEFAULT_CONTENT.industries].map((i) => i.slug));
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/industries/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { industries } = await getSiteContent();
  const i = bySlug(industries, slug);
  return i ? { title: i.name, description: i.summary } : {};
}

export default async function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  const { slug } = await params;
  const { industries, modules } = await getSiteContent();
  const industry = bySlug(industries, slug);
  if (!industry) notFound();

  return (
    <>
      <PageHero
        eyebrow="Industry"
        title={industry.name}
        description={industry.summary}
        crumbs={[{ href: "/industries", label: "Industries" }, { label: industry.name }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="navy" size="lg">
            <Link href="/demo">
              Explore the live demo <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/waitlist">Request access</Link>
          </Button>
        </div>
      </PageHero>
      <Section className="py-16 sm:py-20">
        <div className="max-w-4xl">
          <IndustryDetail industry={industry} modules={modules} />
        </div>
      </Section>
    </>
  );
}
