"use client";

import { Link, useDemoPathname } from "@/components/demo/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronRight, Menu, Search } from "lucide-react";

import { GlobalSearch } from "@/components/demo/global-search";
import { NAV_ITEMS, ROUTE_LABELS } from "@/components/demo/nav";
import { NotificationsMenu } from "@/components/demo/notifications-menu";
import { ProfileMenu } from "@/components/demo/profile-menu";
import { SaveErrorBanner, SaveIndicator } from "@/components/workspace/save-indicator";
import { SidebarContent } from "@/components/demo/sidebar";
import { ToastProvider } from "@/components/demo/toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DEMO_TODAY, formatDate } from "@/lib/demo/dates";
import { useSettings } from "@/lib/demo/settings";
import { DemoProvider, useDemoActions } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { useWorkspaceEnv } from "@/lib/workspace/context";

/* ------------------------------------------------------------- Theme ----- */

function subscribeDark(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

/** Applies the demo theme preference to <html> only while the demo is mounted. */
function ThemeEffect() {
  const theme = useSettings().theme;
  const systemDark = useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
  const dark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    return () => {
      root.classList.remove("dark");
      root.style.colorScheme = "";
    };
  }, [dark]);
  return null;
}

/* --------------------------------------------------------- Breadcrumbs --- */

function Breadcrumbs() {
  const pathname = useDemoPathname();
  const { mode } = useWorkspaceEnv();
  const label = ROUTE_LABELS[pathname] ?? NAV_ITEMS.find((n) => n.href !== "/demo" && pathname.startsWith(n.href))?.label ?? "Overview";
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        <li className="hidden text-muted-foreground sm:block">
          <Link href="/demo" className="rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            {mode === "demo" ? "Demo workspace" : "Workspace"}
          </Link>
        </li>
        <li aria-hidden="true" className="hidden text-muted-foreground/60 sm:block">
          <ChevronRight className="size-3.5" />
        </li>
        <li className="truncate font-semibold text-foreground" aria-current="page">
          {label}
        </li>
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------- Shell ----- */

export function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = useDemoPathname();
  const { syncRecordToRoute } = useDemoActions();
  const { mode } = useWorkspaceEnv();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Drawers belong to their page: close one that is left open when the route changes (e.g. browser Back).
  useEffect(() => {
    syncRecordToRoute(pathname);
  }, [pathname, syncRecordToRoute]);

  // Cmd/Ctrl + K opens global search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-muted/40">
      <ThemeEffect />
      <a
        href="#demo-main"
        className="sr-only z-[70] rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block",
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 sm:max-w-72">
          <SheetTitle className="sr-only">{mode === "demo" ? "Demo navigation" : "Workspace navigation"}</SheetTitle>
          <SheetDescription className="sr-only">Navigate between the modules</SheetDescription>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className={cn("flex min-h-screen min-w-0 flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[4.5rem]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu" onClick={() => setMobileOpen(true)}>
            <Menu />
          </Button>
          <Breadcrumbs />

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search the workspace"
              className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground shadow-card outline-none transition-colors hover:border-ring/40 focus-visible:ring-3 focus-visible:ring-ring/40 md:flex lg:w-72"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem]">Ctrl K</kbd>
            </button>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search the workspace" onClick={() => setSearchOpen(true)}>
              <Search />
            </Button>
            <SaveIndicator />
            <NotificationsMenu />
            <ProfileMenu />
          </div>
        </header>

        {mode === "demo" ? (
          <div className="border-b bg-warning-soft/70 px-4 py-1.5 text-center text-[0.6875rem] font-medium text-warning sm:px-6">
            Simulated demo · fictional sample data as of {formatDate(DEMO_TODAY)} · changes stay in your browser and reset on refresh
          </div>
        ) : (
          <SaveErrorBanner />
        )}

        <main id="demo-main" tabIndex={-1} className="mx-auto w-full max-w-[90rem] min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

export function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ToastProvider>
        <ShellInner>{children}</ShellInner>
      </ToastProvider>
    </DemoProvider>
  );
}
