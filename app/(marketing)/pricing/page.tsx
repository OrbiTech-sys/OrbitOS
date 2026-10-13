import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { PricingTiers } from "@/components/marketing/pricing-tiers";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Illustrative OrbitOS pricing tiers. Final pricing has not been set and nothing can be purchased yet.",
};

const ROWS: { feature: string; starter: boolean; growth: boolean; business: boolean }[] = [
  { feature: "CRM and contacts", starter: true, growth: true, business: true },
  { feature: "Projects and tasks", starter: true, growth: true, business: true },
  { feature: "Quotations and invoices", starter: true, growth: true, business: true },
  { feature: "Orders and inventory", starter: false, growth: true, business: true },
  { feature: "Finance overview", starter: false, growth: true, business: true },
  { feature: "Analytics and reporting", starter: false, growth: true, business: true },
  { feature: "AI copilot", starter: false, growth: true, business: true },
  { feature: "Multiple locations", starter: false, growth: false, business: true },
  { feature: "Advanced permissions", starter: false, growth: false, business: true },
  { feature: "Workflow automation", starter: false, growth: false, business: true },
  { feature: "Integration support", starter: false, growth: false, business: true },
];

function Cell({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <>
      <Check className="mx-auto size-4 text-primary" aria-hidden="true" />
      <span className="sr-only">Included in {label}</span>
    </>
  ) : (
    <>
      <Minus className="mx-auto size-4 text-muted-foreground/50" aria-hidden="true" />
      <span className="sr-only">Not included in {label}</span>
    </>
  );
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Illustrative tiers, honest status"
        description="OrbitOS is a proof of concept, so nothing is for sale. These tiers show how the modules could be packaged. Treat every number as a placeholder."
        crumbs={[{ label: "Pricing" }]}
      />
      <Section className="py-14 sm:py-20">
        <PricingTiers />

        <div className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">Compare what each tier would include</h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card shadow-card">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">Illustrative feature comparison across Starter, Growth and Business tiers</caption>
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Feature
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">
                    Starter
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold text-primary">
                    Growth
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">
                    Business
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ROWS.map((r) => (
                  <tr key={r.feature}>
                    <th scope="row" className="px-5 py-3 text-left font-medium text-foreground">
                      {r.feature}
                    </th>
                    <td className="px-5 py-3 text-center">
                      <Cell on={r.starter} label="Starter" />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Cell on={r.growth} label="Growth" />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Cell on={r.business} label="Business" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-navy-950 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Want to shape the real pricing?</h2>
            <p className="mt-1 text-sm text-navy-200">Tell us how your team works and which modules matter most.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-navy-900 hover:bg-slate-100">
              <Link href="/waitlist">Join the waitlist</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/contact">Contact the team</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
