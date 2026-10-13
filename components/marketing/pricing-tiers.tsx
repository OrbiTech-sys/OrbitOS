import Link from "next/link";
import { Check, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/content/site";
import { cn } from "@/lib/utils";

/** Three illustrative tiers. Prices are placeholders, not a commercial offer. */
export function PricingTiers() {
  return (
    <div>
      <div className="mx-auto flex max-w-3xl items-start gap-2.5 rounded-xl border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-foreground">Illustrative pricing, not an offer.</strong> OrbitOS is a proof of concept and nothing can be
          purchased. These tiers only show how modules could be packaged.
        </p>
      </div>
      <ul className="mt-10 grid gap-6 lg:grid-cols-3">
        {PRICING.map((tier) => (
          <li key={tier.id}>
            <article
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-card p-7 shadow-card",
                tier.featured && "border-primary shadow-elevated ring-1 ring-primary/30",
              )}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most likely fit for growing teams</span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{tier.audience}</p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-foreground">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.priceNote}</span>
              </p>
              <Button asChild variant={tier.featured ? "default" : "outline"} size="lg" className="mt-6 w-full">
                <Link href={tier.id === "business" ? "/contact" : "/waitlist"}>{tier.cta}</Link>
              </Button>
              <ul className="mt-7 space-y-3 border-t pt-6 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-foreground/85">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
