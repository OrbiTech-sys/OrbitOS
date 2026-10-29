"use client";

import { Link, useDemoPathname } from "@/components/demo/link";
import { cn } from "@/lib/utils";
import { useWorkspaceEnv } from "@/lib/workspace/context";

const TABS = [
  { href: "/demo/settings", label: "Preferences" },
  { href: "/demo/settings/users", label: "Users & access" },
] as const;

/**
 * Switches between the sections of Settings. Admins get a second one, Users &
 * access; everyone else (and the public demo) has just the one page, so no tabs.
 */
export function SettingsTabs() {
  const { mode, profile } = useWorkspaceEnv();
  const pathname = useDemoPathname();
  if (mode === "demo" || !profile?.isAdmin) return null;

  return (
    <nav aria-label="Settings sections" className="mb-6 flex gap-1 border-b">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
