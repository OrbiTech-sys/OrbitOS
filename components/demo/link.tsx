"use client";

import { useMemo, type ComponentProps } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { canonicalPath, resolveHref, useWorkspaceEnv } from "@/lib/workspace/context";

/**
 * Drop-in replacements for next/link and next/navigation inside the workspace
 * screens. Links and paths are written as "/demo/..." everywhere; these map
 * them to the route the screen is actually mounted on (/demo or /workspace).
 */

export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { base } = useWorkspaceEnv();
  return <NextLink href={typeof href === "string" ? resolveHref(base, href) : href} {...props} />;
}

/** The current path in its "/demo/..." form, whichever route is mounted. */
export function useDemoPathname() {
  const { base } = useWorkspaceEnv();
  return canonicalPath(base, usePathname());
}

export function useDemoRouter() {
  const router = useRouter();
  const { base } = useWorkspaceEnv();
  return useMemo(
    () => ({
      push: (href: string) => router.push(resolveHref(base, href)),
      replace: (href: string) => router.replace(resolveHref(base, href)),
    }),
    [router, base],
  );
}
