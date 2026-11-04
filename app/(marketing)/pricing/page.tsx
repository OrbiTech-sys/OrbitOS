import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { PricingTiers } from "@/components/marketing/pricing-tiers";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { getSiteContent } from "@/lib/content/store";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { pricing, brand } = await getSiteContent();
  return { title: pricing.eyebrow || "Pricing", description: pricing.description || `${brand.productName} plans and pricing.` };
}

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

export default async function PricingPage() {
  const { pricing } = await getSiteContent();
  const { tiers, comparison, closing } = pricing;

  return (
    <>
      <PageHero eyebrow={pricing.eyebrow} title={pricing.title} description={pricing.description} crumbs={[{ label: pricing.eyebrow || "Pricing" }]} />
      <Section className="py-14 sm:py-20">
        <PricingTiers pricing={pricing} />

        {tiers.length > 0 && comparison.length > 0 && (
          <div className="mt-20">
            {pricing.comparisonTitle && <h2 className="text-2xl font-semibold tracking-tight">{pricing.comparisonTitle}</h2>}
            <div className="mt-6 overflow-x-auto rounded-2xl border bg-card shadow-card">
              <table className="w-full min-w-[34rem] text-sm">
                <caption className="sr-only">Feature comparison across {tiers.map((t) => t.name).join(", ")}</caption>
                <thead className="bg-muted/60 text-left">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Feature
                    </th>
                    {tiers.map((t) => (
                      <th key={t.id} scope="col" className={cn("px-5 py-3 text-center font-semibold", t.featured && "text-primary")}>
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {comparison.map((row) => (
                    <tr key={row.feature}>
                      <th scope="row" className="px-5 py-3 text-left font-medium text-foreground">
                        {row.feature}
                      </th>
                      {tiers.map((t) => (
                        <td key={t.id} className="px-5 py-3 text-center">
                          <Cell on={row.included.includes(t.id)} label={t.name} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {closing.title && (
          <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl bg-navy-950 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{closing.title}</h2>
              {closing.body && <p className="mt-1 text-sm text-navy-200">{closing.body}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              {closing.primaryLabel && closing.primaryHref && (
                <Button asChild className="bg-white text-navy-900 hover:bg-slate-100">
                  <Link href={closing.primaryHref}>{closing.primaryLabel}</Link>
                </Button>
              )}
              {closing.secondaryLabel && closing.secondaryHref && (
                <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                  <Link href={closing.secondaryHref}>{closing.secondaryLabel}</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
