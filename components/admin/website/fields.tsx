"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";

import { Field, describedBy } from "@/components/shared/form-field";
import { Icon, type IconName } from "@/components/shared/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ICON_NAMES } from "@/lib/content/icons";
import { cn } from "@/lib/utils";
import type { FieldDef, ListDef } from "./definitions";

/**
 * The generic editing form: renders any section from its field definitions. Every
 * input is controlled, so a section is plain JSON from top to bottom, and errors are
 * looked up by their path (for example "tiers.0.price") as the server reports them.
 */

type Item = Record<string, unknown>;

export interface EditorContext {
  errors: Record<string, string>;
  /** Choices for "which modules" and "which plans" fields, kept live as those are edited. */
  modules: { value: string; label: string }[];
  tiers: { value: string; label: string }[];
}

const selectCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive";

const pathOf = (path: string, key: string) => (path ? `${path}.${key}` : key);
const idOf = (path: string) => `site-${path.replace(/[^A-Za-z0-9]+/g, "-")}`;
const hasError = (errors: Record<string, string>, path: string) => Object.keys(errors).some((p) => p === path || p.startsWith(`${path}.`));

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export function FieldsEditor({ fields, value, onChange, path, ctx }: { fields: FieldDef[]; value: Item; onChange: (next: Item) => void; path: string; ctx: EditorContext }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        if (field.showIf && !field.showIf(value)) return null;
        const fieldPath = pathOf(path, field.key);
        const span = "half" in field && field.half ? undefined : "sm:col-span-2";
        return (
          <div key={field.key} className={span}>
            <OneField field={field} value={value[field.key]} onChange={(next) => set(field.key, next)} path={fieldPath} ctx={ctx} />
          </div>
        );
      })}
    </div>
  );
}

function OneField({ field, value, onChange, path, ctx }: { field: FieldDef; value: unknown; onChange: (next: unknown) => void; path: string; ctx: EditorContext }) {
  const id = idOf(path);
  const error = ctx.errors[path];

  switch (field.type) {
    case "text":
    case "href":
      return (
        <Field id={id} label={field.label} error={error} hint={field.hint}>
          <Input
            id={id}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            spellCheck={field.type === "text"}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy(id, error, field.hint)}
          />
        </Field>
      );
    case "textarea":
      return (
        <Field id={id} label={field.label} error={error} hint={field.hint}>
          <Textarea id={id} rows={field.rows ?? 3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={describedBy(id, error, field.hint)} />
        </Field>
      );
    case "lines": {
      // The first problem in the list, whichever line it is on.
      const lineError = error ?? Object.entries(ctx.errors).find(([p]) => p.startsWith(`${path}.`))?.[1];
      return (
        <Field id={id} label={field.label} error={lineError} hint={field.hint}>
          <Textarea
            id={id}
            rows={field.rows ?? Math.min(8, Math.max(3, ((value as string[] | undefined) ?? []).length + 1))}
            value={((value as string[] | undefined) ?? []).join("\n")}
            onChange={(e) => onChange(e.target.value.split("\n"))}
            aria-invalid={!!lineError}
            aria-describedby={describedBy(id, lineError, field.hint)}
          />
        </Field>
      );
    }
    case "switch":
      return (
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-3 py-2.5">
          <div>
            <label htmlFor={id} className="text-sm font-medium">
              {field.label}
            </label>
            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
          </div>
          <Switch id={id} checked={!!value} onCheckedChange={onChange} />
        </div>
      );
    case "select":
      return (
        <Field id={id} label={field.label} error={error} hint={field.hint}>
          <select id={id} className={selectCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      );
    case "icon":
      return (
        <Field id={id} label={field.label} error={error} hint={field.hint}>
          <div className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon name={(value as IconName) ?? "sparkles"} className="size-4" />
            </span>
            <select id={id} className={selectCls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
              {ICON_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </Field>
      );
    case "moduleRefs":
    case "tierRefs":
      return <RefsField field={field} value={(value as string[] | undefined) ?? []} onChange={onChange} options={field.type === "moduleRefs" ? ctx.modules : ctx.tiers} />;
    case "group":
      return (
        <fieldset className="rounded-xl border bg-card p-4">
          <legend className="px-1 text-sm font-semibold">{field.label}</legend>
          {field.hint && <p className="mb-3 text-xs text-muted-foreground">{field.hint}</p>}
          <FieldsEditor fields={field.fields} value={(value as Item) ?? {}} onChange={onChange} path={path} ctx={ctx} />
        </fieldset>
      );
    case "list":
      return <ListEditor def={field} items={(value as Item[] | undefined) ?? []} onChange={onChange} path={path} ctx={ctx} />;
  }
}

function RefsField({ field, value, onChange, options }: { field: FieldDef; value: string[]; onChange: (next: string[]) => void; options: { value: string; label: string }[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{field.label}</legend>
      {options.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">There is nothing to choose from yet.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((o) => {
            const on = value.includes(o.value);
            return (
              <label
                key={o.value}
                className={cn(
                  "cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  on ? "border-primary bg-accent text-accent-foreground" : "bg-card text-foreground/80 hover:bg-muted",
                )}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])} />
                {o.label}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

/** An ordered list of items: add, remove, reorder and expand. Nothing is stored until the section is saved. */
export function ListEditor({ def, items, onChange, path, ctx }: { def: ListDef; items: Item[]; onChange: (next: Item[]) => void; path: string; ctx: EditorContext }) {
  const [open, setOpen] = useState<number | null>(null);

  function move(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpen(open === index ? target : open === target ? index : open);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
    setOpen(open === index ? null : open !== null && open > index ? open - 1 : open);
  }

  function add() {
    onChange([...items, def.newItem()]);
    setOpen(items.length);
  }

  /** Works out the page address of a new item from its title, until someone sets their own. */
  function update(index: number, next: Item) {
    const before = items[index];
    if (def.slugKey && next[def.titleKey] !== before[def.titleKey]) {
      const current = String(before[def.slugKey] ?? "");
      if (current === "" || current === slugify(String(before[def.titleKey] ?? ""))) next = { ...next, [def.slugKey]: slugify(String(next[def.titleKey] ?? "")) };
    }
    onChange(items.map((item, i) => (i === index ? next : item)));
  }

  return (
    <div>
      {def.label && <p className="text-sm font-medium">{def.label}</p>}
      {def.hint && <p className="mt-0.5 text-xs text-muted-foreground">{def.hint}</p>}
      <ul className="mt-2 space-y-2">
        {items.map((item, index) => {
          const itemPath = pathOf(path, String(index));
          const wrong = hasError(ctx.errors, itemPath);
          const expanded = open === index || wrong;
          const hidden = item.visible === false;
          const title = String(item[def.titleKey] ?? "") || `Untitled ${def.itemLabel}`;
          const subtitle = def.subtitleKey ? String(item[def.subtitleKey] ?? "") : "";
          return (
            <li key={index} className={cn("rounded-xl border bg-card", wrong && "border-destructive")}>
              <div className="flex items-center gap-1 p-1.5 pl-3">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(open === index ? null : index)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded py-1 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} aria-hidden="true" />
                  <span className="truncate">{title}</span>
                  {subtitle && <span className="shrink-0 text-xs font-normal text-muted-foreground">{subtitle}</span>}
                  {hidden && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">Hidden</span>}
                </button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} aria-label={`Move ${title} up`} onClick={() => move(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === items.length - 1} aria-label={`Move ${title} down`} onClick={() => move(index, 1)}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" className="text-danger hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${title}`} onClick={() => remove(index)}>
                  <Trash2 />
                </Button>
              </div>
              {expanded && (
                <div className="border-t p-3.5">
                  <FieldsEditor fields={def.fields} value={item} onChange={(next) => update(index, next)} path={itemPath} ctx={ctx} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={add}>
        <Plus /> Add a {def.itemLabel}
      </Button>
    </div>
  );
}
