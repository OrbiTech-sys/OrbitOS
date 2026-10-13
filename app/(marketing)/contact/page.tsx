import type { Metadata } from "next";
import { Clock, MessageSquare, ShieldCheck } from "lucide-react";

import { ContactForm } from "@/components/marketing/forms";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Contact the team",
  description: "Ask about early access, a product walkthrough or partnerships for the OrbitOS proof of concept.",
};

const NOTES = [
  { icon: MessageSquare, title: "Tell us what you would want it to do", body: "The most useful feedback right now is the job you would hand to a connected workspace first." },
  { icon: Clock, title: "No response times promised", body: "This is a proof of concept without a support team. The form demonstrates the experience and validation only." },
  { icon: ShieldCheck, title: "Nothing is stored", body: "Submitted details stay in your browser for the confirmation message and are not sent anywhere." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Contact the team"
        description="Questions about early access, a walkthrough of the demo, or an integration you would need? Start here."
        crumbs={[{ label: "Contact" }]}
      />
      <Section className="py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <ul className="space-y-6">
            {NOTES.map((n) => (
              <li key={n.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <n.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{n.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <ContactForm />
        </div>
      </Section>
    </>
  );
}
