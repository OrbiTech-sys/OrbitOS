import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSiteContent } from "@/lib/content/store";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const content = await getSiteContent();
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <SiteHeader brand={content.brand} nav={content.nav} modules={content.modules} solutions={content.solutions} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter content={content} />
    </>
  );
}
