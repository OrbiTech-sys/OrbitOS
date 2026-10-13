import type { Metadata } from "next";

import { ProjectsView } from "@/components/demo/projects/projects-view";
import { ModuleGate } from "@/components/demo/ui";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <ModuleGate module="projects" name="Projects">
      <ProjectsView />
    </ModuleGate>
  );
}
