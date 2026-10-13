import Link from "next/link";
import { ArrowRight, Bot, Layers, PlayCircle, Puzzle, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PainToSolutionStory } from "@/components/marketing/story/pain-to-solution-story";
import { buildStoryData } from "@/lib/demo/story-data";

const BENEFITS = [
  { icon: Layers, label: "One workspace for your operations" },
  { icon: Puzzle, label: "Start small, add modules later" },
  { icon: Bot, label: "Answers grounded in your own records" },
  { icon: Zap, label: "Less re-typing between tools" },
];

export function Hero() {
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
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/80 py-1 pr-3 pl-1.5 text-xs font-medium text-muted-foreground shadow-card backdrop-blur">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold text-accent-foreground">Proof of concept</span>
            An AI-powered business operating system
          </p>
          <h1 id="hero-title" className="mt-6 text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-foreground sm:text-6xl lg:text-[3.75rem]">
            <span className="block">Stop managing tools.</span>
            <span className="block text-primary">Start running your business.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            Connect your operations, automate repetitive work, and understand what needs attention — all from one intelligent workspace.
          </p>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="navy" size="xl">
              <Link href="/demo">
                Explore the Live Demo <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="#how-it-works">
                <PlayCircle /> See How It Works
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No sign-up. The demo runs in your browser with fictional sample data.</p>
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <li key={b.label} className="flex items-center gap-2.5 text-left text-sm font-medium text-foreground/80">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card text-primary shadow-card">
                <b.icon className="size-4" aria-hidden="true" />
              </span>
              {b.label}
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-12 max-w-6xl sm:mt-14">
          <PainToSolutionStory data={story} />
        </div>
      </div>
    </section>
  );
}
