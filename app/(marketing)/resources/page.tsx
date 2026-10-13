import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Icon, type IconName } from "@/components/shared/icon";
import { StatusBadge } from "@/components/shared/badges";

export const metadata: Metadata = {
  title: "Resources",
  description: "Guides to the OrbitOS demo, product roadmap notes and answers to common questions.",
};

const RESOURCES: { icon: IconName; title: string; body: string; href: string; status: "Available" | "In progress" }[] = [
  { icon: "rocket", title: "Take the product tour", body: "See the animated story, the product preview and the connected workflow on the homepage.", href: "/#how-it-works", status: "Available" },
  { icon: "dashboard", title: "Demo guide", body: "What you can do in the live demo, and which parts are simulated.", href: "/resources#demo-guide", status: "Available" },
  { icon: "alert", title: "Straight answers", body: "What is real today and what is only planned: security, AI, integrations and more.", href: "/#trust", status: "Available" },
  { icon: "file", title: "Frequently asked questions", body: "Availability, data, AI, pricing and implementation.", href: "/#faq", status: "Available" },
  { icon: "code", title: "Backend & data model notes", body: "How a real backend and database schema are planned to connect. Documented in the repository README.", href: "/resources#roadmap", status: "In progress" },
  { icon: "mail", title: "Talk to the team", body: "Questions, feedback or ideas for what the first release should do.", href: "/contact", status: "Available" },
];

const DEMO_STEPS = [
  { title: "Overview", body: "Metrics, revenue trend, recent orders, activity and AI insights, all computed from the sample records." },
  { title: "CRM", body: "Search contacts, filter by stage, add a contact, change a status and set follow-ups." },
  { title: "Orders", body: "Create an order and watch stock, receivables and the dashboard update." },
  { title: "Inventory", body: "Adjust stock and see warnings appear when a product falls below its own threshold." },
  { title: "Projects", body: "Add tasks and mark them complete; counts and notifications follow." },
  { title: "AI Copilot", body: "Ask the six suggested questions. Answers are generated from the dataset by a local, rule-based assistant." },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Guides and straight answers"
        description="A small set of resources for evaluating the proof of concept. Everything here is real content; nothing is a placeholder link."
        crumbs={[{ label: "Resources" }]}
      />
      <Section className="py-14 sm:py-20">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((r) => (
            <li key={r.title}>
              <Link
                href={r.href}
                className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card outline-none transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <Icon name={r.icon} className="size-5" />
                  </span>
                  <StatusBadge tone={r.status === "Available" ? "success" : "info"}>{r.status}</StatusBadge>
                </div>
                <h2 className="mt-4 text-base font-semibold">{r.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary">
                  Open <ArrowRight className="size-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div id="demo-guide" className="mt-20 scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight">Demo guide</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The demo runs entirely in your browser on fictional data as of 13 Oct 2026. Changes last until you refresh the page. Preferences in Settings are kept in local
            storage.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {DEMO_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-xl border bg-card p-5 shadow-card">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">{i + 1}</span>
                <div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/demo" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Open the live demo <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div id="roadmap" className="mt-20 scroll-mt-24 rounded-2xl border bg-muted/50 p-7">
          <h2 className="text-2xl font-semibold tracking-tight">Roadmap notes</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">The proof of concept deliberately has no database, authentication or paid services. The next phase is planned in this order:</p>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>Introduce Drizzle ORM with a PostgreSQL schema that mirrors the typed demo records.</li>
            <li>Replace the in-memory demo store with server actions that run each business rule in a transaction.</li>
            <li>Add authentication, organisations and role-based permissions.</li>
            <li>Connect the copilot to a language model with tool access to organisation data.</li>
            <li>Build the first integrations (email, accounting, payments).</li>
          </ol>
        </div>
      </Section>
    </>
  );
}
