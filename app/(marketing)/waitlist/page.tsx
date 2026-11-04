import type { Metadata } from "next";
import { Check } from "lucide-react";

import { WaitlistForm } from "@/components/marketing/forms";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { getSiteContent } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  const { waitlist } = (await getSiteContent()).contact;
  return { title: waitlist.title, description: waitlist.description };
}

export default async function WaitlistPage() {
  const { contact, brand } = await getSiteContent();
  const page = contact.waitlist;
  return (
    <>
      <PageHero eyebrow={page.eyebrow} title={page.title} description={page.description} crumbs={[{ label: page.title }]} />
      <Section className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            {page.pointsTitle && <h2 className="text-xl font-semibold tracking-tight">{page.pointsTitle}</h2>}
            <ul className="mt-5 space-y-3">
              {page.points.map((p) => (
                <li key={p} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <WaitlistForm productName={brand.productName} successTitle={page.successTitle} successBody={page.successBody} />
        </div>
      </Section>
    </>
  );
}
