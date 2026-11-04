import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CopilotShowcase } from "@/components/marketing/copilot-showcase";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { IndustriesSection } from "@/components/marketing/industries-section";
import { PainPoints } from "@/components/marketing/pain-points";
import { PricingTiers } from "@/components/marketing/pricing-tiers";
import { ProductPreview } from "@/components/marketing/product-preview";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Faq, Trust } from "@/components/marketing/trust-faq";
import { WorkflowDemo } from "@/components/marketing/workflow-demo";
import { getSiteContent } from "@/lib/content/store";

export default async function HomePage() {
  const { home, modules, industries, pricing } = await getSiteContent();
  return (
    <>
      <Hero hero={home.hero} />
      <PainPoints section={home.problems} />
      <ProductPreview />
      <WorkflowDemo />
      <Features section={home.modules} modules={modules} />
      {industries.length > 0 && <IndustriesSection section={home.industries} industries={industries} modules={modules} />}
      <CopilotShowcase />
      <HowItWorks modules={modules} />
      {pricing.tiers.length > 0 && (
        <Section id="pricing" labelledBy="pricing-title" tone="muted">
          <SectionHeading id="pricing-title" eyebrow={pricing.eyebrow} title={pricing.homeTitle} description={pricing.homeDescription} />
          <div className="mt-12">
            <PricingTiers pricing={pricing} />
          </div>
          <p className="mt-8 text-center text-sm">
            <Link href="/pricing" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Compare plans in detail <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </p>
        </Section>
      )}
      <Trust section={home.trust} />
      <Faq section={home.faq} />
      <FinalCta cta={home.finalCta} />
    </>
  );
}
