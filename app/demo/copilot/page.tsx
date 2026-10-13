import type { Metadata } from "next";

import { CopilotView } from "@/components/demo/copilot/copilot-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "AI Copilot" };

export default function CopilotPage() {
  return (
    <ModuleGate module="copilot" name="AI Copilot">
      <CopilotView />
    </ModuleGate>
  );
}
