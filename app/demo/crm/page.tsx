import type { Metadata } from "next";

import { CrmView } from "@/components/demo/crm/crm-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "CRM" };

export default function CrmPage() {
  return (
    <ModuleGate module="crm" name="CRM">
      <CrmView />
    </ModuleGate>
  );
}
