import type { Metadata } from "next";

import { SalesView } from "@/components/demo/sales/sales-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Sales" };

export default function SalesPage() {
  return (
    <ModuleGate module="sales" name="Sales">
      <SalesView />
    </ModuleGate>
  );
}
