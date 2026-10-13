import type { Metadata } from "next";
import { Check } from "lucide-react";

import { WaitlistForm } from "@/components/marketing/forms";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Request early access to OrbitOS. This proof of concept does not collect or store any data.",
};

const POINTS = [
  "Start with the modules you need and add more later",
  "One connected workspace instead of ten tools",
  "A copilot that answers from your own records",
  "Honest progress updates, with no inflated promises",
];

export default function WaitlistPage() {
  return (
    <>
      <PageHero
        eyebrow="Early access"
        title="Join the waitlist"
        description="OrbitOS is not available yet. Tell us a little about your business and we will show you how early access could work."
        crumbs={[{ label: "Waitlist" }]}
      />
      <Section className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">What you would be signing up for</h2>
            <ul className="mt-5 space-y-3">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <WaitlistForm />
        </div>
      </Section>
    </>
  );
}
