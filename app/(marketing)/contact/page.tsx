import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/forms";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { getSiteContent } from "@/lib/content/store";

export async function generateMetadata(): Promise<Metadata> {
  const { contact } = await getSiteContent();
  return { title: contact.contact.title, description: contact.contact.description };
}

export default async function ContactPage() {
  const { contact } = (await getSiteContent()).contact;
  const page = contact;
  return (
    <>
      <PageHero eyebrow={page.eyebrow} title={page.title} description={page.description} crumbs={[{ label: page.eyebrow || "Contact" }]} />
      <Section className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-6">
            {page.notes.map((n) => (
              <li key={n.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon name={n.icon} className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{n.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <ContactForm successTitle={page.successTitle} successBody={page.successBody} />
        </div>
      </Section>
    </>
  );
}
