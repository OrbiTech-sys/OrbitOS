"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Monitor, Moon, RotateCcw, Settings, Sun } from "lucide-react";

import { Avatar } from "@/components/shared/badges";
import { useToast } from "@/components/demo/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateSettings, useSettings } from "@/lib/demo/settings";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import type { ThemePreference } from "@/lib/demo/types";

export function ProfileMenu() {
  const router = useRouter();
  const data = useDemoData();
  const settings = useSettings();
  const actions = useDemoActions();
  const toast = useToast();
  const me = data.team.find((t) => t.id === "tm-alex") ?? data.team[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className="flex items-center gap-2 rounded-full p-0.5 outline-none transition-shadow hover:ring-2 hover:ring-border focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:ring-2 data-[state=open]:ring-border"
        >
          <Avatar member={me} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar member={me} size="lg" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{me.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{me.role} · demo user</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/demo/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuLabel className="pt-2 text-xs font-medium text-muted-foreground">Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={settings.theme} onValueChange={(v) => updateSettings({ theme: v as ThemePreference })}>
          <DropdownMenuRadioItem value="light">
            <Sun /> Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon /> Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor /> System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            actions.reset();
            toast.success("Demo data reset", "The sample dataset has been restored.");
          }}
        >
          <RotateCcw /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <ExternalLink /> Back to the website
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/waitlist">
            <LogOut /> Exit demo
          </Link>
        </DropdownMenuItem>
        <p className="px-2 pt-2 pb-1 text-[0.6875rem] leading-snug text-muted-foreground">There is no real account here. This is a local demonstration.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
