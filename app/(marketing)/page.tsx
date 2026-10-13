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

export default function HomePage() {
  return (
    <>
      <Hero />
      <PainPoints />
      <ProductPreview />
      <WorkflowDemo />
      <Features />
      <IndustriesSection />
      <CopilotShowcase />
      <HowItWorks />
      <Section id="pricing" labelledBy="pricing-title" tone="muted">
        <SectionHeading
          id="pricing-title"
          eyebrow="Pricing"
          title="Simple tiers, clearly illustrative"
          description="Final pricing has not been decided. Join the waitlist to hear how early access will work."
        />
        <div className="mt-12">
          <PricingTiers />
        </div>
        <p className="mt-8 text-center text-sm">
          <Link href="/pricing" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Compare tiers in detail <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </p>
      </Section>
      <Trust />
      <Faq />
      <FinalCta />
    </>
  );
}
