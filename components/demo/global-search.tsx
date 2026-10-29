"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDemoRouter } from "@/components/demo/link";
import { CornerDownLeft, Search } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SEARCH_GROUP_LABEL, searchAll, type SearchResult } from "@/lib/demo/search";
import { useDemoActions, useDemoData } from "@/lib/demo/store";
import { useMoney } from "@/lib/demo/settings";
import { useIsDemo } from "@/lib/workspace/context";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useDemoRouter();
  const data = useDemoData();
  const money = useMoney();
  const demo = useIsDemo();
  const actions = useDemoActions();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => searchAll(data, query, money), [data, query, money]);
  const safeActive = Math.min(active, Math.max(0, results.length - 1));

  // Keep the highlighted option visible when navigating with the keyboard.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${safeActive}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  function choose(r: SearchResult) {
    actions.open(r.ref.kind, r.ref.id);
    router.push(r.href);
    onOpenChange(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((safeActive + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((safeActive - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter" && results[safeActive]) {
      e.preventDefault();
      choose(results[safeActive]);
    }
  }

  const showHint = query.trim().length < 2;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <DialogContent showCloseButton={false} className="top-[10vh] translate-y-0 gap-0 p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">{demo ? "Search the demo workspace" : "Search your workspace"}</DialogTitle>
        <DialogDescription className="sr-only">Search contacts, orders, invoices, quotations, products and tasks. Use the arrow keys to move and Enter to open.</DialogDescription>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="global-search-results"
            aria-activedescendant={results.length ? `gs-${safeActive}` : undefined}
            aria-label={demo ? "Search the demo workspace" : "Search your workspace"}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search contacts, orders, invoices, products, tasks…"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground sm:block">ESC</kbd>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-2">
          {showHint && (
            <div className="px-2 py-3">
              <p className="px-1 text-xs font-medium text-muted-foreground">Jump to</p>
              <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {NAV_ITEMS.slice(0, 9).map((n) => (
                  <li key={n.href}>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(n.href);
                        onOpenChange(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg border bg-card px-2.5 py-2 text-left text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <n.icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {n.label}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 px-1 text-xs text-muted-foreground">Type at least two characters, for example “northbeam”, “INV-”, “chair” or “follow up”.</p>
            </div>
          )}
          {!showHint && results.length === 0 && (
            <p role="status" className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matches for “{query.trim()}”. Try a customer, order number or product name.
            </p>
          )}
          {results.length > 0 && (
            <ul ref={listRef} id="global-search-results" role="listbox" aria-label="Search results">
              {results.map((r, i) => {
                const group = SEARCH_GROUP_LABEL[r.ref.kind];
                const header = i === 0 || results[i - 1].ref.kind !== r.ref.kind;
                return (
                  <li key={`${r.ref.kind}-${r.ref.id}`} role="presentation">
                    {header && <p className="px-2.5 pt-2.5 pb-1 text-[0.6875rem] font-semibold tracking-wider text-muted-foreground uppercase">{group}</p>}
                    <div
                      id={`gs-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === safeActive}
                      onMouseMove={() => setActive(i)}
                      onClick={() => choose(r)}
                      className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2", i === safeActive ? "bg-accent text-accent-foreground" : "hover:bg-muted")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>
                      </div>
                      {i === safeActive && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
