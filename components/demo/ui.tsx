"use client";

import { Link } from "@/components/demo/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpDown, ArrowUpRight, ChevronLeft, ChevronRight, Info, Search, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/demo/settings";
import type { ModuleKey } from "@/lib/demo/types";
import { useIsDemo } from "@/lib/workspace/context";
import { cn } from "@/lib/utils";

const slug = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

/* --------------------------------------------------------------- Layout -- */

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  as: Tag = "section",
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag className={cn("rounded-2xl border bg-card shadow-card", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn(title || action ? "px-5 pb-5" : "p-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}

export function DemoNotice({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border border-dashed border-warning/40 bg-warning-soft px-3.5 py-2.5 text-xs leading-relaxed text-warning", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------------- Stats -- */

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  /** Percentage change; positive is good unless `deltaInverse` semantics are encoded via tone. */
  delta?: number | null;
  icon?: React.ReactNode;
  href?: string;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg [&_svg]:size-3.5",
              tone === "default" && "bg-accent text-accent-foreground",
              tone === "danger" && "bg-danger-soft text-danger",
              tone === "warning" && "bg-warning-soft text-warning",
              tone === "success" && "bg-success-soft text-success",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-1 flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground">
        {delta !== undefined && delta !== null && (
          <span className={cn("inline-flex items-center gap-0.5 font-semibold", delta >= 0 ? "text-success" : "text-warning")}>
            {delta >= 0 ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint}
      </p>
    </>
  );
  const cls = "block rounded-2xl border bg-card p-3.5 shadow-card outline-none transition-[box-shadow,border-color] sm:p-4";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-primary/30 hover:shadow-elevated focus-visible:ring-3 focus-visible:ring-ring/50")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ---------------------------------------------------------------- States -- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground [&_svg]:size-6">{icon ?? <SearchX />}</span>
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Gate for modules the user has hidden in Settings. */
export function ModuleGate({ module, name, children }: { module: ModuleKey; name: string; children: React.ReactNode }) {
  const settings = useSettings();
  const demo = useIsDemo();
  if (settings.modules[module]) return <>{children}</>;
  return (
    <Card>
      <EmptyState
        title={`${name} is hidden`}
        description={demo ? "You turned this module off in Settings. This is a local demo preference." : "You turned this module off in Settings. Turn it back on there whenever you like."}
        action={
          <Button asChild>
            <Link href="/demo/settings">Open Settings</Link>
          </Button>
        }
      />
    </Card>
  );
}

/* --------------------------------------------------------------- Filters -- */

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <label htmlFor={`search-${slug(label)}`} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        id={`search-${slug(label)}`}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm shadow-card outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      />
    </div>
  );
}

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "border-navy-900 bg-navy-900 text-white dark:border-primary dark:bg-primary" : "bg-card text-foreground/80 hover:bg-muted",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[0.6875rem] tabular-nums", active ? "bg-white/20" : "bg-muted text-muted-foreground")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = `select-${slug(label)}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------- DataTable -- */

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** When provided the header becomes a sort control. */
  sortValue?: (row: T) => string | number;
  align?: "right" | "center";
  /** Cell becomes a button that opens the row. */
  primary?: boolean;
  className?: string;
  /** Hide below the md breakpoint to keep tables readable on phones. */
  hideBelow?: "sm" | "md" | "lg";
}

const HIDE: Record<string, string> = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  pageSize = 10,
  empty,
  caption,
  initialSort,
  selectedKey,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  empty: React.ReactNode;
  caption: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  selectedKey?: string | null;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  function toggleSort(key: string) {
    setPage(0);
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
  }

  if (rows.length === 0) return <>{empty}</>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : c.sortValue ? "none" : undefined}
                    className={cn("px-3 py-2.5 font-medium whitespace-nowrap sm:px-4", c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideBelow && HIDE[c.hideBelow])}
                  >
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn("inline-flex items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", c.align === "right" && "flex-row-reverse")}
                      >
                        {c.header}
                        {active ? sort!.dir === "asc" ? <ArrowUp className="size-3" aria-hidden="true" /> : <ArrowDown className="size-3" aria-hidden="true" /> : <ArrowUpDown className="size-3 opacity-50" aria-hidden="true" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((row) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  aria-selected={selectedKey === key ? true : undefined}
                  className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-muted/50", selectedKey === key && "bg-accent/50")}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("px-3 py-3 align-middle sm:px-4", c.align === "right" && "text-right tabular-nums", c.align === "center" && "text-center", c.hideBelow && HIDE[c.hideBelow], c.className)}
                    >
                      {c.primary && onRowClick ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(row);
                          }}
                          className="rounded text-left font-medium whitespace-nowrap text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {c.cell(row)}
                        </button>
                      ) : (
                        c.cell(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && <Pager page={current} pageCount={pageCount} total={sorted.length} pageSize={pageSize} onPage={setPage} />}
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs text-muted-foreground">
      <p>
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page === 0} onClick={() => onPage(page - 1)}>
          <ChevronLeft />
        </Button>
        <span className="min-w-14 text-center tabular-nums">
          {page + 1} / {pageCount}
        </span>
        <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

/* ----------------------------------------------------------- Detail rows -- */

export function DetailList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y rounded-xl border bg-card text-sm">
      {items.map((i) => (
        <div key={i.label} className="flex items-start justify-between gap-4 px-3.5 py-2.5">
          <dt className="shrink-0 text-muted-foreground">{i.label}</dt>
          <dd className="min-w-0 text-right font-medium text-foreground">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
