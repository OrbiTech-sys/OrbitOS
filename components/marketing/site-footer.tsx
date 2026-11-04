import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import type { SiteContent } from "@/lib/content/schema";

/** Built from the same content as the header, so a hidden module or page disappears here too. */
function footerColumns({ nav, modules, solutions, industries }: SiteContent) {
  const links = nav.items.filter((item) => item.kind === "link");
  const productLinks = modules.slice(0, 6).map((m) => ({ href: `/product/${m.slug}`, label: m.name }));
  return [
    { title: nav.items.find((i) => i.kind === "modules")?.label ?? "Product", links: nav.demo.visible ? [...productLinks, { href: nav.demo.href, label: nav.demo.label }] : productLinks },
    { title: nav.items.find((i) => i.kind === "solutions")?.label ?? "Solutions", links: solutions.map((s) => ({ href: `/solutions/${s.slug}`, label: s.name })) },
    { title: "Industries", links: industries.map((i) => ({ href: `/industries/${i.slug}`, label: i.name })) },
    {
      title: "Company",
      links: [
        ...links.filter((l) => l.href !== "/industries").map((l) => ({ href: l.href, label: l.label })),
        { href: "/contact", label: "Contact the team" },
        { href: "/waitlist", label: "Request access" },
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ],
    },
  ].filter((column) => column.links.length > 0);
}

export function SiteFooter({ content }: { content: SiteContent }) {
  const { brand } = content;
  return (
    <footer className="border-t bg-navy-950 text-navy-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2.8fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label={`${brand.productName} home`} className="inline-block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/60">
              <Logo inverse name={brand.productName} />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-navy-300">{brand.footerBlurb}</p>
            {brand.contactEmail && (
              <a href={`mailto:${brand.contactEmail}`} className="mt-3 inline-block rounded text-sm text-navy-200 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-ring">
                {brand.contactEmail}
              </a>
            )}
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns(content).map((col) => (
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
          <p>{brand.copyright}</p>
          <p className="max-w-xl sm:text-right">{brand.footerNote}</p>
        </div>
      </div>
    </footer>
  );
}
