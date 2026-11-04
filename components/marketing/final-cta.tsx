import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { HomeContent } from "@/lib/content/schema";

export function FinalCta({ cta }: { cta: HomeContent["finalCta"] }) {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-16 text-center shadow-float sm:px-12 sm:py-20">
        <div className="bg-grid-dark absolute inset-0 -z-10" aria-hidden="true" />
        <div className="absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden="true" />
        <h2 id="cta-title" className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
          {cta.title}
        </h2>
        {cta.body && <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-navy-200 sm:text-lg">{cta.body}</p>}
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="xl" className="bg-white text-navy-900 hover:bg-slate-100">
            <Link href={cta.primaryHref}>
              {cta.primaryLabel} <ArrowRight />
            </Link>
          </Button>
          {cta.secondaryLabel && cta.secondaryHref && (
            <Button asChild size="xl" className="bg-indigo-500 text-white hover:bg-indigo-400">
              <Link href={cta.secondaryHref}>{cta.secondaryLabel}</Link>
            </Button>
          )}
          {cta.tertiaryLabel && cta.tertiaryHref && (
            <Button asChild size="xl" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href={cta.tertiaryHref}>
                <Mail /> {cta.tertiaryLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
