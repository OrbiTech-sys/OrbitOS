"use client";

import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

/** Shows a one-time password once, with a copy button. It is never stored or shown again. */
export function TempPasswordNotice({ message, email, password, onDone }: { message: string; email: string; password: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nTemporary password: ${password}\nSign in: ${window.location.origin}/sign-in`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4" role="status">
      <p className="text-sm font-medium">{message}</p>
      <dl className="space-y-2 rounded-xl border bg-muted/50 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate font-medium">{email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Temporary password</dt>
          <dd className="font-mono font-semibold tracking-wide select-all">{password}</dd>
        </div>
      </dl>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-warning">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        This is shown only once. Share it privately; they must choose a new password when they first sign in.
      </p>
      <DialogFooter className="border-t pt-4">
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy sign-in details"}
        </Button>
        <Button type="button" variant="navy" onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}
