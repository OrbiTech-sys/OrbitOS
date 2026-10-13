"use client";

import Link from "next/link";
import { ArrowRight, Boxes, FolderKanban, LayoutDashboard, Sparkles, Users } from "lucide-react";

import { PreviewCrm } from "@/components/marketing/preview/crm";
import { PreviewInventory } from "@/components/marketing/preview/inventory";
import { PreviewOperations } from "@/components/marketing/preview/operations";
import { PreviewOverview } from "@/components/marketing/preview/overview";
import { DemoLabel, Section, SectionHeading } from "@/components/marketing/section";
import { CopilotChat } from "@/components/shared/copilot-chat";
import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEED_DATA } from "@/lib/demo/seed";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/demo", blurb: "Revenue, receivables, pipeline and stock in one view." },
  { id: "crm", label: "CRM & Sales", icon: Users, href: "/demo/crm", blurb: "Move deals through stages; follow-ups stay visible." },
  { id: "inventory", label: "Inventory", icon: Boxes, href: "/demo/inventory", blurb: "Stock bars and warnings use each product's own threshold." },
  { id: "operations", label: "Operations", icon: FolderKanban, href: "/demo/projects", blurb: "Tasks, owners and workload that react as work gets done." },
  { id: "copilot", label: "AI Copilot", icon: Sparkles, href: "/demo/copilot", blurb: "Ask a question and get an answer built from the same records." },
] as const;

export function ProductPreview() {
  return (
    <Section id="preview" labelledBy="preview-title">
      <SectionHeading
        id="preview-title"
        eyebrow="Product preview"
        title="Explore the workspace, one area at a time"
        description="Every tab below is a working miniature of the live demo, running on the same sample records. Click around: nothing you do leaves your browser."
      />
      <div className="mt-12">
        <Tabs defaultValue="overview" className="gap-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
            <TabsList className="mx-auto h-auto w-max min-w-full justify-start gap-1 rounded-2xl border bg-card p-1.5 shadow-card sm:min-w-0 sm:justify-center">
              {TABS.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="h-10 flex-none gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground data-[state=active]:bg-navy-900 data-[state=active]:text-white data-[state=active]:shadow-card dark:data-[state=active]:bg-primary"
                >
                  <t.icon aria-hidden="true" />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="overflow-hidden rounded-3xl border bg-muted/70 shadow-float ring-1 ring-black/[0.02]">
            {/* App chrome */}
            <div className="flex items-center gap-3 border-b bg-card/80 px-4 py-2.5">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="size-2.5 rounded-full bg-slate-300" />
                <span className="size-2.5 rounded-full bg-slate-300" />
              </span>
              <span className="mx-auto flex max-w-xs flex-1 items-center justify-center gap-2 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                <LogoMark className="size-3.5" /> app.orbitos.example / demo
              </span>
              <DemoLabel className="hidden sm:inline-flex">Illustrative sample data</DemoLabel>
            </div>

            <div className="p-3 sm:p-5">
              {TABS.map((t) => (
                <TabsContent key={t.id} value={t.id} className="min-h-[30rem] outline-none">
                  <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-3")}>
                    <p className="text-sm text-muted-foreground">{t.blurb}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={t.href}>
                        Open in the live demo <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                  {t.id === "overview" && <PreviewOverview />}
                  {t.id === "crm" && <PreviewCrm />}
                  {t.id === "inventory" && <PreviewInventory />}
                  {t.id === "operations" && <PreviewOperations />}
                  {t.id === "copilot" && <CopilotChat data={SEED_DATA} height="h-[28rem]" />}
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </div>
    </Section>
  );
}
