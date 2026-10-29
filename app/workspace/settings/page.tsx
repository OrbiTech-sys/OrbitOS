import type { Metadata } from "next";

import { SettingsView } from "@/components/demo/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsView />;
}
