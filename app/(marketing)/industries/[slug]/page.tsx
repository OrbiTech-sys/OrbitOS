import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { IndustryDetail } from "@/components/marketing/industries-section";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, INDUSTRY_BY_SLUG } from "@/lib/content/industries";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/industries/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const i = INDUSTRY_BY_SLUG[slug];
  return i ? { title: i.name, description: i.summary } : {};
}

export default async function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  const { slug } = await params;
  const industry = INDUSTRY_BY_SLUG[slug];
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
            <Link href="/waitlist">Join the waitlist</Link>
          </Button>
        </div>
      </PageHero>
      <Section className="py-16 sm:py-20">
        <div className="max-w-4xl">
          <IndustryDetail industry={industry} />
        </div>
      </Section>
    </>
  );
}
