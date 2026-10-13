import { cn } from "@/lib/utils";

/** Consistent section wrapper: vertical rhythm, max width, optional anchor id. */
export function Section({
  id,
  className,
  innerClassName,
  children,
  tone = "default",
  labelledBy,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
  tone?: "default" | "muted" | "dark";
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative scroll-mt-20 py-20 sm:py-24",
        tone === "muted" && "bg-muted/60",
        tone === "dark" && "bg-navy-950 text-white",
        className,
      )}
    >
      <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", innerClassName)}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "center",
  className,
  inverse = false,
}: {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  inverse?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className={cn("mb-3 text-xs font-semibold tracking-[0.14em] uppercase", inverse ? "text-indigo-300" : "text-primary")}>{eyebrow}</p>
      )}
      <h2 id={id} className={cn("text-3xl font-semibold tracking-tight sm:text-4xl", inverse ? "text-white" : "text-foreground")}>
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-base leading-relaxed text-pretty sm:text-lg", inverse ? "text-navy-200" : "text-muted-foreground")}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Small, honest label for simulated content. */
export function DemoLabel({ children = "Illustrative sample data", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-input bg-card/80 px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      {children}
    </span>
  );
}
