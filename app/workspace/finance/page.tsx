import type { Metadata } from "next";

import { FinanceView } from "@/components/demo/finance/finance-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return (
    <ModuleGate module="finance" name="Finance">
      <FinanceView />
    </ModuleGate>
  );
}
