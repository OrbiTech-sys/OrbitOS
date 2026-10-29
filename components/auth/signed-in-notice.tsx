import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Shown above the sign-in form when this browser already has a session. It never
 * skips the form: it just says who is signed in and lets them continue or sign out.
 */
export async function SignedInNotice() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div role="status" className="mt-6 rounded-xl border bg-muted/50 p-4 text-sm">
      <p>
        You&apos;re already signed in as <strong className="font-medium">{user.email}</strong>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="navy">
          <Link href="/workspace">
            Continue to your workspace <ArrowRight />
          </Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" size="sm" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">To use a different account, sign in below.</p>
    </div>
  );
}
