import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · OrbitOS admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <Link href="/admin" aria-label="OrbitOS admin home" className="shrink-0">
            <Logo hideWordmark className="sm:hidden" />
            <Logo className="hidden sm:inline-flex" />
          </Link>
          <AdminNav />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
