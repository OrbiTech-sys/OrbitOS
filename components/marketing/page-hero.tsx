import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: { href?: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b bg-gradient-to-b from-accent/50 to-background pt-12 pb-14 sm:pt-16 sm:pb-16">
      <div className="bg-grid absolute inset-x-0 top-0 -z-10 h-72" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                  Home
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                  {c.href ? (
                    <Link href={c.href} className="rounded hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-foreground">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-primary uppercase">{eyebrow}</p>}
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}
