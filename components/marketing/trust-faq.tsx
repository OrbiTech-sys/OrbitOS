import { Section, SectionHeading } from "@/components/marketing/section";
import { Icon } from "@/components/shared/icon";
import { StatusBadge } from "@/components/shared/badges";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ, TRUST, type TrustItem } from "@/lib/content/site";

const STATUS_TONE: Record<TrustItem["status"], "info" | "neutral" | "warning" | "primary"> = {
  "Design goal": "primary",
  Planned: "info",
  "Demo only": "warning",
  "Not available": "neutral",
};

export function Trust() {
  return (
    <Section id="trust" labelledBy="trust-title" tone="muted">
      <SectionHeading
        id="trust-title"
        eyebrow="Straight answers"
        title="What is real today, and what is not"
        description="We would rather be clear than impressive. No customer logos, testimonials, certifications or uptime promises appear here because none exist yet."
      />
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST.map((t) => (
          <li key={t.title}>
            <article className="h-full rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon name={t.icon} className="size-[1.125rem]" />
                </span>
                <StatusBadge tone={STATUS_TONE[t.status]}>{t.status}</StatusBadge>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Faq() {
  return (
    <Section id="faq" labelledBy="faq-title">
      <div className="mx-auto max-w-3xl">
        <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions you are probably asking" />
        <Accordion type="single" collapsible className="mt-10 rounded-2xl border bg-card px-6 shadow-card">
          {FAQ.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="py-4 text-[0.9375rem] font-semibold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
