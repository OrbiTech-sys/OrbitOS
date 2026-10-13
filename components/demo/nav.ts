import {
  BarChart3,
  Boxes,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { ModuleKey } from "@/lib/demo/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Settings can hide a module; Overview and Settings are always visible. */
  module: ModuleKey | null;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/demo", label: "Overview", icon: LayoutDashboard, module: null },
  { href: "/demo/copilot", label: "AI Copilot", icon: Sparkles, module: "copilot" },
  { href: "/demo/crm", label: "CRM", icon: Users, module: "crm" },
  { href: "/demo/sales", label: "Sales", icon: TrendingUp, module: "sales" },
  { href: "/demo/orders", label: "Orders", icon: ShoppingCart, module: "orders" },
  { href: "/demo/inventory", label: "Inventory", icon: Boxes, module: "inventory" },
  { href: "/demo/finance", label: "Finance", icon: Wallet, module: "finance" },
  { href: "/demo/projects", label: "Projects", icon: FolderKanban, module: "projects" },
  { href: "/demo/team", label: "Team", icon: UsersRound, module: "team" },
  { href: "/demo/analytics", label: "Analytics", icon: BarChart3, module: "analytics" },
  { href: "/demo/settings", label: "Settings", icon: Settings, module: null },
];

export const ROUTE_LABELS: Record<string, string> = Object.fromEntries(NAV_ITEMS.map((n) => [n.href, n.label]));
