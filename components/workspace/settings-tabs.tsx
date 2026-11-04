"use client";

import { Link, useDemoPathname } from "@/components/demo/link";
import { cn } from "@/lib/utils";
import { useWorkspaceEnv } from "@/lib/workspace/context";

const TABS = [
  { href: "/demo/settings", label: "Preferences", access: "everyone" },
  { href: "/demo/settings/users", label: "Users & access", access: "admin" },
  { href: "/demo/settings/inbox", label: "Inbox", access: "admin" },
  { href: "/demo/settings/website", label: "Website", access: "super" },
] as const;

/**
 * Switches between the sections of Settings. Admins also get Users & access and the
 * website's Inbox; a super admin also gets the Website editor. Everyone else (and the
 * public demo) has just the one page, so no tabs. This only decides what to show:
 * each page and action checks the role again on the server.
 */
export function SettingsTabs() {
  const { mode, profile } = useWorkspaceEnv();
  const pathname = useDemoPathname();
  if (mode === "demo" || !profile?.isAdmin) return null;

  const tabs = TABS.filter((tab) => tab.access === "everyone" || (tab.access === "admin" && profile.isAdmin) || (tab.access === "super" && profile.isSuperAdmin));

  return (
    <nav aria-label="Settings sections" className="mb-6 flex gap-1 overflow-x-auto border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
