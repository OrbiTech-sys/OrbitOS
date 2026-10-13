"use client";

import { MotionConfig } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * App-wide client providers.
 * - MotionConfig: every Framer Motion animation honours the OS
 *   "reduce motion" preference (transform/layout animations are disabled).
 * - TooltipProvider: shared delay settings for Radix tooltips.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </MotionConfig>
  );
}
