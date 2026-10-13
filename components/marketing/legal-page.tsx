import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <>
      <PageHero eyebrow="Legal placeholder" title={title} description={intro} crumbs={[{ label: title }]} />
      <Section className="py-14 sm:py-20">
        <div className="max-w-3xl space-y-8">
          <p className="rounded-xl border border-dashed bg-warning-soft px-4 py-3 text-sm leading-relaxed text-warning">
            This is a placeholder written for a proof of concept. It is not legal advice and is not a binding document. A reviewed version will replace it before any
            launch.
          </p>
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
