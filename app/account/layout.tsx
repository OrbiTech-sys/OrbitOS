import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: { default: "Account", template: "%s · OrbitOS" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
          <Link href="/" aria-label="OrbitOS home">
            <Logo />
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
