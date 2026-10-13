"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Icon } from "@/components/shared/icon";
import { Logo } from "@/components/shared/logo";
import { MODULES } from "@/lib/content/modules";
import { SOLUTIONS } from "@/lib/content/site";
import { cn } from "@/lib/utils";

const TOP_LINKS = [
  { href: "/industries", label: "Industries" },
  { href: "/resources", label: "Resources" },
  { href: "/pricing", label: "Pricing" },
];

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

function useScrolled(threshold = 8) {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > threshold,
    () => false,
  );
}

const navTrigger =
  "h-9 rounded-lg bg-transparent px-3 text-sm font-medium text-foreground/75 hover:bg-muted hover:text-foreground focus:bg-muted data-open:bg-muted data-open:text-foreground data-popup-open:bg-muted data-[state=open]:bg-muted data-[state=open]:text-foreground";

function isActive(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-[background-color,border-color,box-shadow] duration-200",
        scrolled ? "border-border bg-background/90 shadow-card backdrop-blur-md" : "border-transparent bg-background/70 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="OrbitOS home" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>

        {/* Desktop navigation */}
        <div className="ml-6 hidden flex-1 lg:block">
          <NavigationMenu aria-label="Primary" viewport={false} className="max-w-none justify-start">
            <NavigationMenuList className="justify-start gap-0.5">
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(navTrigger, isActive(pathname, "/product") && "text-foreground")}>
                  Product
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[min(46rem,calc(100vw-3rem))] p-3">
                    <ul className="grid grid-cols-2 gap-1">
                      {MODULES.map((m) => (
                        <li key={m.slug}>
                          <NavigationMenuLink asChild data-active={pathname === `/product/${m.slug}` ? "" : undefined} className="items-start gap-3 p-2.5">
                            <Link href={`/product/${m.slug}`}>
                              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                                <Icon name={m.icon} className="size-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">{m.name}</span>
                                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{m.tagline}</span>
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-xs">
                      <span className="text-muted-foreground">Start with what you need. Expand when you&apos;re ready.</span>
                      <NavigationMenuLink asChild className="w-auto gap-1 p-0 font-medium text-primary hover:bg-transparent focus:bg-transparent">
                        <Link href="/demo">
                          Open the live demo <ArrowRight className="size-3.5" />
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(navTrigger, isActive(pathname, "/solutions") && "text-foreground")}>
                  Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="w-[min(26rem,calc(100vw-3rem))] p-3">
                    {SOLUTIONS.map((s) => (
                      <li key={s.slug}>
                        <NavigationMenuLink asChild data-active={pathname === `/solutions/${s.slug}` ? "" : undefined} className="items-start gap-3 p-2.5">
                          <Link href={`/solutions/${s.slug}`}>
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                              <Icon name={s.icon} className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">{s.name}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{s.tagline}</span>
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {TOP_LINKS.map((l) => (
                <NavigationMenuItem key={l.href}>
                  <NavigationMenuLink asChild data-active={isActive(pathname, l.href) ? "" : undefined}>
                    <Link
                      href={l.href}
                      aria-current={isActive(pathname, l.href) ? "page" : undefined}
                      className={cn(
                        "h-9 rounded-lg px-3 py-0 text-sm font-medium text-foreground/75 hover:text-foreground",
                        isActive(pathname, l.href) && "bg-accent text-accent-foreground hover:bg-accent",
                      )}
                    >
                      {l.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="navy">
            <Link href="/waitlist">
              Get started <ArrowRight />
            </Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" showCloseButton={false} id="mobile-nav" className="gap-0 p-0 data-[side=right]:w-[min(22rem,92vw)] data-[side=right]:sm:max-w-sm">
          <div className="flex h-16 items-center justify-between border-b px-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
            <Logo />
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X />
              </Button>
            </SheetClose>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-4">
            <MobileGroup label="Product">
              {MODULES.map((m) => (
                <li key={m.slug}>
                  <MobileLink href={`/product/${m.slug}`} pathname={pathname} onNavigate={() => setMobileOpen(false)}>
                    <Icon name={m.icon} className="size-4 text-muted-foreground" />
                    {m.name}
                  </MobileLink>
                </li>
              ))}
            </MobileGroup>
            <MobileGroup label="Solutions">
              {SOLUTIONS.map((s) => (
                <li key={s.slug}>
                  <MobileLink href={`/solutions/${s.slug}`} pathname={pathname} onNavigate={() => setMobileOpen(false)}>
                    <Icon name={s.icon} className="size-4 text-muted-foreground" />
                    {s.name}
                  </MobileLink>
                </li>
              ))}
            </MobileGroup>
            <ul className="mt-2 space-y-0.5 border-t pt-2">
              {TOP_LINKS.map((l) => (
                <li key={l.href}>
                  <MobileLink href={l.href} pathname={pathname} onNavigate={() => setMobileOpen(false)}>
                    {l.label}
                  </MobileLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t p-4">
            <Button asChild variant="navy" size="lg" className="w-full" onClick={() => setMobileOpen(false)}>
              <Link href="/waitlist">Get started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full" onClick={() => setMobileOpen(false)}>
              <Link href="/demo">Explore the live demo</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full" onClick={() => setMobileOpen(false)}>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function MobileGroup({ label, defaultOpen, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = `mobile-group-${label.toLowerCase()}`;
  return (
    <div className="border-b py-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {label}
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      <ul id={id} hidden={!open} className="space-y-0.5 pb-2">
        {children}
      </ul>
    </div>
  );
}

function MobileLink({
  href,
  pathname,
  onNavigate,
  children,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "bg-accent text-accent-foreground" : "text-foreground/80",
      )}
    >
      {children}
    </Link>
  );
}
