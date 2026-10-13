import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-16 text-center shadow-float sm:px-12 sm:py-20">
        <div className="bg-grid-dark absolute inset-0 -z-10" aria-hidden="true" />
        <div className="absolute -top-24 left-1/2 -z-10 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden="true" />
        <h2 id="cta-title" className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-5xl">
          Your business deserves a simpler way to work.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-navy-200 sm:text-lg">
          See a connected workspace in action, then tell us what you would want it to do for you.
        </p>
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="xl" className="bg-white text-navy-900 hover:bg-slate-100">
            <Link href="/demo">
              Explore the demo <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="xl" className="bg-indigo-500 text-white hover:bg-indigo-400">
            <Link href="/waitlist">Join the waitlist</Link>
          </Button>
          <Button asChild size="xl" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/contact">
              <Mail /> Contact the team
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
