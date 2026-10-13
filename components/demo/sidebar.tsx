"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Logo, LogoMark } from "@/components/shared/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDemoActions } from "@/lib/demo/store";
import { useSettings } from "@/lib/demo/settings";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

export function isActive(pathname: string, href: string) {
  return href === "/demo" ? pathname === "/demo" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const settings = useSettings();
  const { closeRecord } = useDemoActions();
  const items = NAV_ITEMS.filter((n) => n.module === null || settings.modules[n.module]);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-16 shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/" aria-label="OrbitOS website" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          {collapsed ? <LogoMark inverse /> : <Logo inverse />}
        </Link>
      </div>

      <nav aria-label="Demo modules" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            const link = (
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  closeRecord();
                  onNavigate?.();
                }}
                className={cn(
                  "group/nav relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  collapsed ? "justify-center px-0" : "px-3",
                  active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-white",
                )}
              >
                {active && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-sidebar-primary" aria-hidden="true" />}
                <item.icon className={cn("size-[1.125rem] shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover/nav:text-sidebar-foreground")} aria-hidden="true" />
                <span className={cn(collapsed && "sr-only")}>{item.label}</span>
              </Link>
            );
            return (
              <li key={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-3 rounded-lg bg-sidebar-accent px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-white">{settings.businessName}</p>
            <p className="mt-0.5 text-[0.6875rem] leading-snug text-sidebar-foreground/70">Demo workspace · fictional sample data</p>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-lg text-xs font-medium text-sidebar-foreground/70 outline-none transition-colors hover:bg-sidebar-accent/70 hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              collapsed ? "justify-center" : "px-3",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!collapsed && "Collapse"}
          </button>
        )}
      </div>
    </div>
  );
}
