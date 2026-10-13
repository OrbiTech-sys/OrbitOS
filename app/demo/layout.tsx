import type { Metadata } from "next";

import { DemoShell } from "@/components/demo/shell";

export const metadata: Metadata = {
  title: { default: "Live demo", template: "%s · OrbitOS demo" },
  description: "An interactive OrbitOS workspace running on fictional sample data in your browser.",
};

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return <DemoShell>{children}</DemoShell>;
}
