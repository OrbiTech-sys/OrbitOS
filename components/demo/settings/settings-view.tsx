"use client";

import { useState } from "react";
import { z } from "zod";
import { Bell, Check, Coins, LayoutGrid, Monitor, Moon, Palette, RotateCcw, Store, Sun } from "lucide-react";

import { useToast } from "@/components/demo/toast";
import { Card, DemoNotice, PageHeader } from "@/components/demo/ui";
import { Field, describedBy } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CURRENCIES, moneyFormatter } from "@/lib/demo/format";
import { useSettings, useSettingsActions } from "@/lib/demo/settings";
import { useDemoActions } from "@/lib/demo/store";
import { useIsDemo } from "@/lib/workspace/context";
import { AccountCard, StorageCard } from "@/components/workspace/account-cards";
import { SettingsTabs } from "@/components/workspace/settings-tabs";
import type { ModuleKey, NotificationPrefs, ThemePreference } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

// A member can leave the optional details blank; the demo profile always has them.
const profileSchema = (demo: boolean) =>
  z.object({
    businessName: z.string().trim().min(1, "Business name is required").max(60, "Keep it under 60 characters"),
    contactEmail: demo
      ? z.string().trim().min(1, "Contact email is required").pipe(z.email("Enter a valid email address"))
      : z.string().trim().refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
    location: z.string().trim().max(60, "Keep it under 60 characters"),
    industry: demo ? z.string().trim().min(1) : z.string().trim(),
  });

const INDUSTRIES = ["Retail and e-commerce", "Professional services", "Agencies and consulting", "Manufacturing", "Wholesale and distribution", "Technology and SaaS"];

const THEMES: { value: ThemePreference; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const NOTIFICATIONS: { key: keyof NotificationPrefs; label: string; hint: string }[] = [
  { key: "overdueInvoices", label: "Overdue invoices", hint: "Invoices past their due date" },
  { key: "lowStock", label: "Low stock", hint: "Products below their own threshold" },
  { key: "followUps", label: "Follow-ups due", hint: "Leads and contacts whose follow-up date has arrived" },
  { key: "tasks", label: "Tasks", hint: "Tasks due today and overdue tasks" },
  { key: "orders", label: "Orders awaiting processing", hint: "Pending orders" },
];

const MODULES: { key: ModuleKey; label: string; hint: string }[] = [
  { key: "copilot", label: "AI Copilot", hint: "Rule-based assistant" },
  { key: "crm", label: "CRM", hint: "Contacts and leads" },
  { key: "sales", label: "Sales", hint: "Quotations and pipeline" },
  { key: "orders", label: "Orders", hint: "Order management" },
  { key: "inventory", label: "Inventory", hint: "Products and stock" },
  { key: "finance", label: "Finance", hint: "Invoices and expenses" },
  { key: "projects", label: "Projects", hint: "Tasks and projects" },
  { key: "team", label: "Team", hint: "Ownership and workload" },
  { key: "analytics", label: "Analytics", hint: "Charts and reports" },
];

export function SettingsView() {
  const settings = useSettings();
  const actions = useDemoActions();
  const toast = useToast();
  const demo = useIsDemo();
  const { update: updateSettings, reset: resetSettings } = useSettingsActions();

  const [profile, setProfile] = useState({
    businessName: settings.businessName,
    contactEmail: settings.contactEmail,
    location: settings.location,
    industry: settings.industry,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema(demo).safeParse(profile);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    updateSettings(parsed.data);
    toast.success("Business profile saved", demo ? "Stored in this browser only." : "Saved to your account.");
  }

  return (
    <>
      <PageHeader title="Settings" description={demo ? "Local demonstration preferences." : "Your business profile and preferences."} />
      <SettingsTabs />
      {demo && (
        <DemoNotice className="mb-6">
          <strong>These are local demo settings, not account settings.</strong> They are saved in this browser&apos;s local storage, are never sent anywhere, and there is no real account, billing or security configuration here.
        </DemoNotice>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Business profile" description="Shown in the sidebar and dashboard greeting">
          <form onSubmit={saveProfile} noValidate className="space-y-4">
            <Field id="s-name" label="Business name" error={errors.businessName}>
              <Input id="s-name" value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} aria-invalid={!!errors.businessName} aria-describedby={describedBy("s-name", errors.businessName)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="s-industry" label="Industry">
                <select
                  id="s-industry"
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {!demo && <option value="">Select an industry</option>}
                  {INDUSTRIES.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </Field>
              <Field id="s-location" label="Location" optional error={errors.location}>
                <Input id="s-location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
              </Field>
            </div>
            <Field id="s-email" label="Contact email" error={errors.contactEmail}>
              <Input id="s-email" type="email" value={profile.contactEmail} onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })} aria-invalid={!!errors.contactEmail} aria-describedby={describedBy("s-email", errors.contactEmail)} />
            </Field>
            <Button type="submit">
              <Store /> Save profile
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card title="Preferred currency" description="Display only. Amounts are not converted." action={<Coins className="size-4 text-muted-foreground" aria-hidden="true" />}>
            <label htmlFor="s-currency" className="sr-only">
              Preferred currency
            </label>
            <select
              id="s-currency"
              value={settings.currency}
              onChange={(e) => {
                updateSettings({ currency: e.target.value as typeof settings.currency });
                toast.success("Currency updated", "Figures now display in the new currency format.");
              }}
              className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm text-muted-foreground">
              Example: {demo ? "a sample order" : "an amount"} of <strong className="text-foreground">{moneyFormatter(settings.currency).full(12345)}</strong>. {demo ? "The sample data" : "Your data"} is stored as entered and only the symbol and format change.
            </p>
          </Card>

          <Card title="Theme" description={demo ? "Applies to the demo workspace" : "Applies to your workspace"} action={<Palette className="size-4 text-muted-foreground" aria-hidden="true" />}>
            <div role="radiogroup" aria-label="Theme preference" className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const active = settings.theme === t.value;
                return (
                  <label
                    key={t.value}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      active ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary/30" : "hover:bg-muted",
                    )}
                  >
                    <input type="radio" name="theme" value={t.value} checked={active} onChange={() => updateSettings({ theme: t.value })} className="sr-only" />
                    <t.icon className="size-5" />
                    {t.label}
                    {active && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </Card>
        </div>

        <Card title="Notification preferences" description="Choose which alerts appear in the bell menu" action={<Bell className="size-4 text-muted-foreground" aria-hidden="true" />}>
          <ul className="divide-y">
            {NOTIFICATIONS.map((n) => (
              <li key={n.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div>
                  <label htmlFor={`n-${n.key}`} className="text-sm font-medium">
                    {n.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{n.hint}</p>
                </div>
                <Switch id={`n-${n.key}`} checked={settings.notifications[n.key]} onCheckedChange={(v) => updateSettings((s) => ({ ...s, notifications: { ...s.notifications, [n.key]: v } }))} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Module visibility" description="Hide modules you don't need; the sidebar updates immediately" action={<LayoutGrid className="size-4 text-muted-foreground" aria-hidden="true" />}>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {MODULES.map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-4 border-b py-3 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                <div>
                  <label htmlFor={`m-${m.key}`} className="text-sm font-medium">
                    {m.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{m.hint}</p>
                </div>
                <Switch id={`m-${m.key}`} checked={settings.modules[m.key]} onCheckedChange={(v) => updateSettings((s) => ({ ...s, modules: { ...s.modules, [m.key]: v } }))} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Overview and Settings are always visible.</p>
        </Card>

        {!demo && <StorageCard />}
        {!demo && <AccountCard />}

        <Card className="xl:col-span-2" title="Reset" description={demo ? "Start over with fresh sample data or default preferences" : "Return your preferences to their defaults"}>
          <div className="flex flex-wrap gap-3">
            {demo && (
              <Button
                variant="outline"
                onClick={() => {
                  actions.reset();
                  toast.success("Demo data reset", "All sample records were restored.");
                }}
              >
                <RotateCcw /> Reset demo data
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                const defaults = resetSettings();
                setProfile({ businessName: defaults.businessName, contactEmail: defaults.contactEmail, location: defaults.location, industry: defaults.industry });
                toast.success("Preferences reset", demo ? "Defaults restored and local storage cleared." : "Defaults restored. Your records are untouched.");
              }}
            >
              <RotateCcw /> Reset preferences
            </Button>
          </div>
          {demo ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Preferences are stored under the local-storage key <code className="rounded bg-muted px-1 py-0.5 font-mono">orbitos-demo-settings-v1</code>. Sample records are kept in memory only.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Resetting preferences does not delete any of your records.</p>
          )}
        </Card>
      </div>
    </>
  );
}
