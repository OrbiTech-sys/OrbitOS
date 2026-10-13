import type { Metadata } from "next";

import { OverviewView } from "@/components/demo/overview/overview-view";

export const metadata: Metadata = { title: "Overview" };

export default function DemoOverviewPage() {
  return <OverviewView />;
}
