import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { INDUSTRIES } from "@/lib/content/industries";
import { MODULES } from "@/lib/content/modules";
import { SOLUTIONS } from "@/lib/content/site";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [...MODULES.slice(0, 6).map((m) => ({ href: `/product/${m.slug}`, label: m.name })), { href: "/demo", label: "Live demo" }],
  },
  {
    title: "Solutions",
    links: SOLUTIONS.map((s) => ({ href: `/solutions/${s.slug}`, label: s.name })),
  },
  {
    title: "Industries",
    links: INDUSTRIES.map((i) => ({ href: `/industries/${i.slug}`, label: i.name })),
  },
  {
    title: "Company",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/resources", label: "Resources" },
      { href: "/contact", label: "Contact the team" },
      { href: "/waitlist", label: "Join the waitlist" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-navy-950 text-navy-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2.8fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="OrbitOS home" className="inline-block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/60">
              <Logo inverse />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-navy-300">
              A proof of concept for a simpler, modular business operating system. OrbitOS is a working placeholder name; nothing here is a
              commercial product yet.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="text-xs font-semibold tracking-wider text-white uppercase">{col.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link
                        href={l.href}
                        className="rounded text-sm text-navy-300 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 OrbitOS proof of concept. All sample data is fictional.</p>
          <p className="max-w-xl sm:text-right">
            Product names and platforms referenced during research belong to their respective owners. OrbitOS is not affiliated with them.
          </p>
        </div>
      </div>
    </footer>
  );
}
