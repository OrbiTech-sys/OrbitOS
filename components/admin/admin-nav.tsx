"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, KeyRound, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <nav aria-label="Admin" className="flex items-center gap-1">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {l.label}
            </Link>
          );
        })}
        <Link
          href="/demo"
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Workspace <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href="/admin/password">
            <KeyRound /> Password
          </Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
            <LogOut /> <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
