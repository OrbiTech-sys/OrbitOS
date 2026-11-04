import Link from "next/link";
import { ArrowRight, Bot, Layers, PlayCircle, Puzzle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PainToSolutionStory } from "@/components/marketing/story/pain-to-solution-story";
import type { HomeContent } from "@/lib/content/schema";
import { buildStoryData } from "@/lib/demo/story-data";

const BENEFIT_ICONS = [Layers, Puzzle, Bot, Zap];

export function Hero({ hero }: { hero: HomeContent["hero"] }) {
  const story = buildStoryData();

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-14 pb-16 sm:pt-20 sm:pb-24">
      <div className="bg-grid absolute inset-x-0 top-0 -z-10 h-[34rem]" aria-hidden="true" />
      <div
        className="absolute top-[-9rem] left-1/2 -z-10 h-[24rem] w-[52rem] max-w-full -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {(hero.badge || hero.badgeText) && (
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/80 py-1 pr-3 pl-1.5 text-xs font-medium text-muted-foreground shadow-card backdrop-blur">
              {hero.badge && <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-foreground">{hero.badge}</span>}
              {hero.badgeText}
            </p>
          )}
          <h1 id="hero-title" className="mt-6 text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-foreground sm:text-6xl lg:text-[3.75rem]">
            <span className="block">{hero.titleLine1}</span>
            {hero.titleLine2 && <span className="block text-primary">{hero.titleLine2}</span>}
          </h1>
          {hero.description && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{hero.description}</p>}
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="navy" size="xl">
              <Link href={hero.primaryHref}>
                {hero.primaryLabel} <ArrowRight />
              </Link>
            </Button>
            {hero.secondaryLabel && hero.secondaryHref && (
              <Button asChild variant="outline" size="xl">
                <Link href={hero.secondaryHref}>
                  <PlayCircle /> {hero.secondaryLabel}
                </Link>
              </Button>
            )}
          </div>
          {hero.note && <p className="mt-4 text-xs text-muted-foreground">{hero.note}</p>}
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {hero.benefits.map((label, i) => {
            const BenefitIcon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
            return (
              <li key={label} className="flex items-center gap-2.5 text-left text-sm font-medium text-foreground/80">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card text-primary shadow-card">
                  <BenefitIcon className="size-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
          <PainToSolutionStory data={story} />
        </div>
      </div>
    </section>
  );
}
