"use client";

import { useTransition } from "react";
import { ExternalLink, KeyRound, LogOut, Monitor, Moon, RotateCcw, Settings, ShieldCheck, Sun } from "lucide-react";

import { Link, useDemoRouter } from "@/components/demo/link";
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
import { signOut } from "@/lib/auth/actions";
import { useSettings, useSettingsActions } from "@/lib/demo/settings";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import type { TeamMember, ThemePreference } from "@/lib/demo/types";
import { useWorkspaceEnv } from "@/lib/workspace/context";

const FALLBACK_ME: TeamMember = { id: "me", name: "You", role: "", email: "", initials: "Y", tone: "indigo" };

export function ProfileMenu() {
  const router = useDemoRouter();
  const data = useDemoData();
  const settings = useSettings();
  const { update: updateSettings } = useSettingsActions();
  const actions = useDemoActions();
  const toast = useToast();
  const { mode, selfId, profile } = useWorkspaceEnv();
  const [signingOut, startSignOut] = useTransition();
  const me = data.team.find((t) => t.id === selfId) ?? data.team[0] ?? FALLBACK_ME;
  const demo = mode === "demo";

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
            <span className="block truncate text-sm font-semibold text-foreground">{profile?.name ?? me.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {demo ? `${me.role} · demo user` : `${profile?.email ?? me.email} · ${profile?.roleLabel ?? ""}`}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/demo/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        {profile?.isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/demo/settings/users">
              <ShieldCheck /> Users &amp; access
            </Link>
          </DropdownMenuItem>
        )}
        {!demo && (
          <DropdownMenuItem asChild>
            <Link href="/account/password">
              <KeyRound /> Change password
            </Link>
          </DropdownMenuItem>
        )}
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
        {demo && (
          <DropdownMenuItem
            onSelect={() => {
              actions.reset();
              toast.success("Demo data reset", "The sample dataset has been restored.");
            }}
          >
            <RotateCcw /> Reset demo data
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/">
            <ExternalLink /> Back to the website
          </Link>
        </DropdownMenuItem>
        {demo ? (
          <DropdownMenuItem asChild>
            <Link href="/waitlist">
              <LogOut /> Exit demo
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled={signingOut} onSelect={() => startSignOut(() => signOut())}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        )}
        {demo && <p className="px-2 pt-2 pb-1 text-[0.6875rem] leading-snug text-muted-foreground">There is no real account here. This is a local demonstration.</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
