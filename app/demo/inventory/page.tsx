import type { Metadata } from "next";

import { InventoryView } from "@/components/demo/inventory/inventory-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return (
    <ModuleGate module="inventory" name="Inventory">
      <InventoryView />
    </ModuleGate>
  );
}
