import type { Metadata } from "next";

import { AnalyticsView } from "@/components/demo/analytics/analytics-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <ModuleGate module="analytics" name="Analytics">
      <AnalyticsView />
    </ModuleGate>
  );
}
