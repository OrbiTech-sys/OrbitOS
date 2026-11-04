import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import type { LegalPageContent } from "@/lib/content/schema";

export function LegalPage({ page }: { page: LegalPageContent }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={page.title} description={page.intro} crumbs={[{ label: page.title }]} />
      <Section className="py-14 sm:py-20">
        <div className="max-w-3xl space-y-8">
          {page.updated && <p className="text-sm text-muted-foreground">Last updated {page.updated}</p>}
          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
