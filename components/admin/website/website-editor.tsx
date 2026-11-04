"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, Save, TriangleAlert, Undo2 } from "lucide-react";

import { ConfirmDialog } from "@/components/demo/confirm-dialog";
import { Button } from "@/components/ui/button";
import { resetSiteSection, saveSiteSection } from "@/lib/content/actions";
import { SECTION_SCHEMAS, type SectionKey, type SiteContent } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import { SECTIONS } from "./definitions";
import { FieldsEditor, ListEditor, type EditorContext } from "./fields";

type Drafts = Record<SectionKey, unknown>;
type Notice = { tone: "success" | "error"; text: string } | null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const issuesByPath = (issues: { path: PropertyKey[]; message: string }[]) => Object.fromEntries(issues.map((i) => [i.path.join("."), i.message]));

/**
 * Settings → Website, for super admins. Every section of the public website is edited
 * here and saved on its own. Drafts are kept while moving between sections, so nothing
 * is lost until you choose to discard it. The browser checks the rules first for quick
 * feedback; the server checks them again and has the final say.
 */
export function WebsiteEditor({ initial, edited, loadError }: { initial: SiteContent; edited: string[]; loadError: boolean }) {
  const [saved, setSaved] = useState<Drafts>(initial);
  const [drafts, setDrafts] = useState<Drafts>(initial);
  const [customised, setCustomised] = useState(() => new Set(edited));
  const [active, setActive] = useState<SectionKey>("nav");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, startTransition] = useTransition();

  const section = SECTIONS.find((s) => s.key === active)!;
  const dirtyKeys = useMemo(() => new Set(SECTIONS.filter((s) => !same(drafts[s.key], saved[s.key])).map((s) => s.key)), [drafts, saved]);
  const dirty = dirtyKeys.has(active);

  // Warn before losing unsaved work by leaving the page.
  useEffect(() => {
    if (dirtyKeys.size === 0) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyKeys.size]);

  const ctx = useMemo<EditorContext>(
    () => ({
      errors,
      modules: (drafts.modules as SiteContent["modules"]).map((m) => ({ value: m.slug, label: m.name })).filter((m) => m.value),
      tiers: ((drafts.pricing as SiteContent["pricing"]).tiers ?? []).map((t) => ({ value: t.id, label: t.name })),
    }),
    [errors, drafts.modules, drafts.pricing],
  );

  function choose(key: SectionKey) {
    setActive(key);
    setErrors({});
    setNotice(null);
  }

  function change(next: unknown) {
    setDrafts((d) => ({ ...d, [active]: next }));
    setNotice(null);
    // After a failed save, problems disappear as they are fixed.
    if (Object.keys(errors).length > 0) {
      const checked = SECTION_SCHEMAS[active].safeParse(next);
      setErrors(checked.success ? {} : issuesByPath(checked.error.issues));
    }
  }

  function save() {
    const checked = SECTION_SCHEMAS[active].safeParse(drafts[active]);
    if (!checked.success) {
      setErrors(issuesByPath(checked.error.issues));
      setNotice({ tone: "error", text: "Please fix the highlighted problems and save again." });
      return;
    }
    setErrors({});
    startTransition(async () => {
      try {
        const result = await saveSiteSection(active, checked.data);
        if (!result.ok) {
          setErrors(Object.fromEntries((result.issues ?? []).map((i) => [i.path, i.message])));
          setNotice({ tone: "error", text: result.error });
          return;
        }
        setSaved((s) => ({ ...s, [active]: result.data }));
        setDrafts((d) => ({ ...d, [active]: result.data }));
        setCustomised((c) => new Set(c).add(active));
        setNotice({ tone: "success", text: result.message });
      } catch {
        setNotice({ tone: "error", text: "The change couldn't be saved. Check your connection and try again." });
      }
    });
  }

  function reset() {
    setConfirmReset(false);
    setErrors({});
    startTransition(async () => {
      try {
        const result = await resetSiteSection(active);
        if (!result.ok) {
          setNotice({ tone: "error", text: result.error });
          return;
        }
        setSaved((s) => ({ ...s, [active]: result.data }));
        setDrafts((d) => ({ ...d, [active]: result.data }));
        setCustomised((c) => {
          const next = new Set(c);
          next.delete(active);
          return next;
        });
        setNotice({ tone: "success", text: result.message });
      } catch {
        setNotice({ tone: "error", text: "The section couldn't be reset. Check your connection and try again." });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Website</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Everything visitors see: the menu bar, each product and solution, the prices and the rest of the wording. Changes go live as soon as you save.</p>
      </div>

      {loadError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          The saved website content couldn&apos;t be loaded, so this shows the defaults. Reload before saving, or you may overwrite your changes.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Website sections" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-current={s.key === active ? "page" : undefined}
              onClick={() => choose(s.key)}
              className={cn(
                "flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring lg:w-full",
                s.key === active ? "bg-accent text-accent-foreground" : "text-foreground/75 hover:bg-muted",
              )}
            >
              {s.label}
              {dirtyKeys.has(s.key) && (
                <span className="size-2 rounded-full bg-warning" title="Unsaved changes">
                  <span className="sr-only">Unsaved changes</span>
                </span>
              )}
            </button>
          ))}
        </nav>

        <section aria-labelledby="site-section-title" className="min-w-0 rounded-2xl border bg-card shadow-card">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
            <div className="min-w-0">
              <h3 id="site-section-title" className="text-base font-semibold">
                {section.label}
              </h3>
              <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">{section.description}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{customised.has(active) ? "Customised." : "Using the built-in default."}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={section.preview} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> View on the site
              </a>
            </Button>
          </header>

          <div className="p-5">
            {section.list ? (
              <ListEditor key={active} def={section.list} items={drafts[active] as Record<string, unknown>[]} onChange={change} path="" ctx={ctx} />
            ) : (
              <FieldsEditor key={active} fields={section.fields ?? []} value={drafts[active] as Record<string, unknown>} onChange={change} path="" ctx={ctx} />
            )}
          </div>

          <footer className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-b-2xl border-t bg-card p-4">
            {notice && (
              <p role={notice.tone === "error" ? "alert" : "status"} className={cn("flex w-full items-center gap-1.5 text-sm font-medium", notice.tone === "error" ? "text-danger" : "text-success")}>
                {notice.tone === "error" ? <TriangleAlert className="size-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />}
                {notice.text}
              </p>
            )}
            <Button type="button" onClick={save} disabled={pending || !dirty}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />} Save
            </Button>
            <Button type="button" variant="outline" disabled={pending || !dirty} onClick={() => { setDrafts((d) => ({ ...d, [active]: saved[active] })); setErrors({}); setNotice(null); }}>
              <Undo2 /> Discard changes
            </Button>
            <Button type="button" variant="ghost" className="ml-auto" disabled={pending || !customised.has(active)} onClick={() => setConfirmReset(true)}>
              <RotateCcw /> Reset to default
            </Button>
          </footer>
        </section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={`Reset ${section.label} to the default?`}
        description="This replaces everything you have set in this section with the original content, and the website changes straight away. It can't be undone."
        confirmLabel="Reset to default"
        onCancel={() => setConfirmReset(false)}
        onConfirm={reset}
      />
    </div>
  );
}
