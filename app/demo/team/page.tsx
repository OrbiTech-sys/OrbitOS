import type { Metadata } from "next";

import { TeamView } from "@/components/demo/team/team-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <ModuleGate module="team" name="Team">
      <TeamView />
    </ModuleGate>
  );
}
