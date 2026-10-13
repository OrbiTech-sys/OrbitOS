import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-20">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto size-11" />
        <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-primary uppercase">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page drifted out of orbit</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">The page you are looking for does not exist or has moved.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="navy">
            <Link href="/">Back to the homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/demo">
              Open the demo <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
