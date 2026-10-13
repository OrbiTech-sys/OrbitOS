import { cn } from "@/lib/utils";

/** OrbitOS mark: a core with a single orbiting node. Pure SVG, no assets. */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className={inverse ? "fill-white" : "fill-navy-900"} />
      <ellipse
        cx="16"
        cy="16"
        rx="9.5"
        ry="4.6"
        transform="rotate(-28 16 16)"
        className={inverse ? "stroke-indigo-300" : "stroke-indigo-300"}
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="3.4" className={inverse ? "fill-navy-900" : "fill-white"} />
      <circle cx="23.4" cy="11.4" r="2.1" className={inverse ? "fill-indigo-500" : "fill-indigo-400"} />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  inverse = false,
  hideWordmark = false,
}: {
  className?: string;
  markClassName?: string;
  /** Use on dark backgrounds. */
  inverse?: boolean;
  hideWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} inverse={inverse} />
      <span
        className={cn(
          "text-[1.0625rem] font-semibold tracking-tight",
          inverse ? "text-white" : "text-foreground",
          hideWordmark && "sr-only",
        )}
      >
        Orbit<span className={inverse ? "text-indigo-300" : "text-primary"}>OS</span>
      </span>
    </span>
  );
}
