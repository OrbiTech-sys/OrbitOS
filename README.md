# OrbitOS — AI-native business operating system (proof of concept)

OrbitOS is a **working placeholder name** for a simpler, modular business operating system. This repository is a polished,
believable proof of concept: a marketing website, a public interactive demo, and real accounts with their own saved
workspaces.

> - **`/demo`** is the public demo: fictional sample data that lives entirely in the browser. It needs no account and
>   resets on refresh, so it can be shown to anyone.
> - **`/workspace`** is a signed-in member's own workspace. It is the same set of screens running on *their* records,
>   saved to Supabase.
> - There is no separate admin area. Admins and super admins use the same workspace as everyone, and manage users from
>   **Settings → Users & access** (add members, deactivate, reactivate, delete, see each one's storage use).
>
> See [Supabase](#supabase-auth-and-database) and [Member workspaces](#member-workspaces). There is no payment or AI
> service in this phase.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start the development server (Turbopack)             |
| `npm run build`     | Production build (type-checks and prerenders routes) |
| `npm run start`     | Serve the production build                           |
| `npm run lint`      | ESLint (Next.js core-web-vitals + TypeScript rules)  |
| `npm run typecheck` | `tsc --noEmit`                                       |
| `npm run db:setup`  | Migrate, seed the super admin, then run the checks   |
| `npm run db:check`  | End-to-end connection and security check             |
| `npm run test:workspace` | Workspace self-test: rules, save queue, and the real database path |

Requires Node 22.9+ (the `db:*` scripts use `--env-file-if-exists`). The project uses **Next.js 16** (App Router, Cache Components enabled), **React 19**, **TypeScript** (strict),
**Tailwind CSS v4**, **shadcn/ui** primitives (Radix), **Lucide**, **Framer Motion**, **Recharts**, **React Hook Form + Zod**.

## Supabase (auth and database)

1. Copy `.env.example` to `.env.local` and fill it in (Supabase dashboard → Project Settings → API Keys, and Connect →
   Session pooler connection string). `.env.local` is git-ignored.
2. In Supabase → Authentication → Sign In / Providers, turn off **Allow new users to sign up**. Accounts are created by
   an administrator.
3. `npm run db:setup` applies `supabase/migrations`, creates the super admin from `SUPER_ADMIN_EMAIL` /
   `SUPER_ADMIN_PASSWORD`, and runs `db:check`. Re-running is safe and never resets a changed password.
4. Sign in at `/sign-in`. An account with a temporary password is sent to `/account/password` until it is changed. Then
   everyone lands in `/workspace`.
5. Add everyone else in **Settings → Users & access** (`/workspace/settings/users`, admins only). Each new user gets a one-time temporary password (shown once, to share privately)
   and must replace it at first sign-in. No email setup is needed.

Who can do what (`lib/auth/permissions.ts`, enforced in every Server Action):

| | Super admin | Admin | Member |
| --- | :-: | :-: | :-: |
| Use their own workspace | ✔ | ✔ | ✔ |
| Add users | any role | members | – |
| Deactivate, reactivate, delete | anyone but themselves | members | – |
| Change roles, reset passwords, set storage limits | ✔ | – | – |
| See each member's storage use | ✔ | ✔ | – |
| See what a member's records contain | – | – | only their own |

How it is secured:

- **Row Level Security everywhere.** `public.profiles` is deny-by-default: anonymous visitors get nothing, users read their
  own row and may edit only their name, admins read all rows. Roles cannot be changed through the API.
- **No keys in the browser.** All auth runs in Server Actions with the publishable key; session cookies are `httpOnly`.
  The secret key is used server-side only by the user-management actions (`lib/auth/user-actions.ts`), each of which
  re-checks the caller first. The database URL is used only by the `db:*` scripts.
- **Deactivation is immediate.** It blocks sign-in and, through RLS, removes elevated access even for a session that is
  still open. A database guard always keeps at least one active super admin.
- **Audit log.** Every user-management action is recorded in `public.audit_log`, append-only and readable by super
  admins (shown under Settings → Users & access).
- **`proxy.ts`** refreshes sessions and guards `/workspace` and `/account` only, so marketing and demo pages
  stay static. Pages and actions re-check the user themselves (`lib/auth/session.ts`).
- Password changes re-verify the current password; a database trigger clears the temporary-password flag only when the
  stored hash actually changes. `?next=` redirects are limited to `/workspace` paths.
- `npm run db:check` proves it: it signs in a throwaway user, confirms they see only their own row and cannot promote
  themselves, then deletes them.

## Member workspaces

Every member gets a private workspace: CRM, sales, orders, inventory, finance, projects, team, analytics, the assistant and
settings, all on their own records. It reuses the demo's screens, so there is one set of business rules (stock reservation,
invoicing, quotations, …) for both.

- **Storage.** Each record is one row in `public.workspace_records` (`owner_id`, `kind`, `id`, JSON `data`). Row Level Security
  lets a member read and write only their own rows, and only while their account is active. Rows are small (32 KB max) and
  each member has a storage limit (50 MB by default; a super admin can change it). A trigger keeps `public.workspace_usage`
  (records and bytes per member) current and refuses writes past the limit.
- **Saving.** Screens change a local store as before; the changes are picked up, queued and saved in the background in
  small batches (`lib/workspace/sync.ts`) through one Server Action (`lib/workspace/actions.ts`). The server checks who is
  calling, validates every record against `lib/workspace/schemas.ts`, and writes as the member, so the database has the final
  say. Failures retry automatically; the header shows *Saved* / *Saving…* / *Not saved*, and leaving with unsaved changes
  asks first.
- **Loading.** `app/workspace/layout.tsx` reads the member's rows on each request and starts the store from them. New members
  start empty, with themselves as the only team member.
- **What admins see.** Only counts and sizes: per-member usage on Settings → Users & access and a per-module breakdown from
  `workspace_usage_breakdown`, which returns aggregates and nothing else. Admins can't read a member's records.
- **Deactivating** a member cuts off their reads and writes at once, even mid-session, and keeps their data so reactivating
  restores it. **Deleting** a member deletes their workspace with them.
- **The demo is untouched.** `/demo` still runs on the fixed date and seed data, nothing is saved, and it works without an
  account. The two differ only through a small environment (`lib/workspace/context.tsx`) and a store config
  (`StoreConfig` in `lib/demo/store.tsx`): fixed vs real date, counter vs unique ids, resettable vs saved.

Limits to know about: two tabs open on the same record overwrite each other (last save wins per record); the assistant is
rule-based, and payments, bank connections, tax and email sending are not implemented.

`npm run test:workspace` checks all of this: the demo's behaviour, a realistic member session against the validation
schemas, the save queue, the save endpoint, and (with `.env.local`) the whole path against Supabase with throwaway members.

## Routes

| Route                                                  | Purpose                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `/`                                                    | Marketing homepage (story animation, previews, pricing, FAQ) |
| `/product/[slug]`                                      | One page per module (10 modules)                            |
| `/solutions/[slug]`                                    | Outcome-led solution pages (5)                              |
| `/industries`, `/industries/[slug]`                    | Industry overview and six industry pages                    |
| `/pricing`                                             | Illustrative pricing tiers and comparison                   |
| `/resources`                                           | Demo guide, roadmap notes, links                            |
| `/contact`, `/waitlist`                                | Validated forms (nothing is sent or stored)                 |
| `/sign-in`                                             | Email + password sign-in (Supabase Auth, no public sign-up)  |
| `/workspace/settings/users`                            | Admins only: add users, change roles, reset passwords, deactivate, delete, see storage |
| `/account/password`                                    | Change your own password (forced for temporary passwords)    |
| `/workspace` and `/workspace/*`                        | A member's own workspace: the same ten screens as the demo, saved |
| `/privacy`, `/terms`                                   | Honest placeholders                                         |
| `/demo`                                                | Dashboard overview                                          |
| `/demo/copilot`                                        | AI copilot (deterministic demo assistant)                   |
| `/demo/crm`                                            | Contacts, leads, follow-ups                                 |
| `/demo/sales`                                          | Quotations and pipeline                                     |
| `/demo/orders`                                         | Orders and the create-order flow                            |
| `/demo/inventory`                                      | Products, thresholds, stock adjustments                     |
| `/demo/finance`                                        | Invoices, receivables, expenses (illustrative)              |
| `/demo/projects`                                       | Projects and tasks                                          |
| `/demo/team`                                           | Ownership and workload overview                             |
| `/demo/analytics`                                      | Interactive Recharts dashboards                             |
| `/demo/settings`                                       | Local demo preferences                                      |

## Project layout

```
app/
  (marketing)/…         marketing routes sharing the site header/footer layout
  demo/…                demo application routes (shared shell layout)
  workspace/…           a member's own workspace (same screens, loaded from and saved to the database)
  account/…             password change and deactivated notice
components/
  ui/                   shadcn/ui primitives (Radix) lightly restyled to the OrbitOS design system
  marketing/            homepage sections, story animation, product preview, forms
  demo/                 application shell, module views, dialogs, drawers (used by /demo and /workspace)
  workspace/            workspace shell, save indicator, storage and account cards
  admin/, auth/         user-management screens (Settings → Users & access) and sign-in / password forms
  shared/               components used by both: logo, icons, badges, charts, copilot chat
lib/
  content/              marketing content (modules, industries, FAQ, pricing, …)
  demo/                 the typed data layer (see below)
  workspace/            records ⇄ rows, validation schemas, save queue, loading, environment (demo vs workspace)
  auth/, supabase/      sessions, permissions, user-management actions, Supabase clients and types
```

### The data layer (`lib/demo`)

| File            | Role                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `types.ts`      | Domain types: contacts, products, orders, quotations, invoices, expenses, projects, tasks, activities   |
| `seed.ts`       | Deterministic, interconnected sample dataset (seeded PRNG + fixed "today", so SSR and client always agree) |
| `selectors.ts`  | Pure functions that compute every dashboard metric, chart series and alert from the records             |
| `store.tsx`     | External store + typed actions (create order, adjust stock, convert quotation, …) with all business rules; a `StoreConfig` switches between the demo and a workspace |
| `copilot.ts`    | Deterministic demo assistant: intent matching → selectors → structured, linkable answers                |
| `settings.tsx`  | Preferences (theme, currency, notification toggles, module visibility): browser-only in the demo, saved with the member's records in a workspace |
| `schemas.ts`    | Zod schemas used by the forms                                                                           |

Relationships are real: orders reference customers and products, invoices reference customers and orders, tasks reference
projects, and so on. Dashboard counts, notifications, global search and AI answers are all derived from the same records, so
they can never disagree with each other.

**The demo runs on a fixed date** (13 Oct 2026, `DEMO_TODAY` in `lib/demo/dates.ts`). That keeps overdue/due-today logic
stable, avoids hydration mismatches, and respects Next.js Cache Components (no `Date.now()` during render). A workspace
follows the member's own calendar instead (`useToday()`), starting from the server's date so the first render matches.

## What you can do in the demo

- **Overview** – KPIs, revenue trend (6M/12M), recent orders, activity feed, AI insights panel with quick questions.
- **Create orders / quotations** – validated line-item form with live totals and stock warnings. Creating an order reserves
  stock, can issue an invoice, logs activity and updates the dashboard, notifications and copilot answers instantly.
- **Quotations** – send, accept (creates an order, reserves stock and converts a lead into a customer) or decline.
- **CRM** – search, filter by stage, sort, add a contact (React Hook Form + Zod), change lead status, set follow-ups, log a contact.
- **Inventory** – search, category and status filters, add a product, adjust stock with a reason, edit thresholds, create reorder
  tasks; warnings use each product's own threshold (below threshold = warning, zero = out of stock).
- **Finance** – invoice filters, mark paid, receivables ageing, expenses (add/filter), revenue vs expenses chart.
- **Projects** – filter/search tasks, add a task, change status, mark complete; project cards act as filters.
- **Analytics** – sales trend (metric + range toggles), orders by status (highlight), revenue by category, lead conversion funnel.
- **Copilot** – the six suggested questions plus pipeline, top customers and pending orders; answers link to the records.
- **Global search** (`Ctrl/⌘ K`), **notifications** (derived from data, read state, preference-aware), **profile menu**, **theme**.
- **Settings** – business profile, currency (display only), theme, notification and module toggles; saved to `localStorage`.

On the marketing site: the 14-second pain-to-solution story (play/pause/replay, scene stepper, reduced-motion support), a tabbed
interactive product preview, the connected-workflow demo (a lead walked through to the dashboard using the same store rules),
an industry selector, an onboarding preview, pricing, trust cards and an FAQ.

## What is simulated (and says so)

- **The public demo** (`/demo`): data is fictional and in memory; refreshing restores the seed data. Only UI preferences use
  `localStorage`. Nothing is sent anywhere.
- **Everywhere:** invoices, "Mark as paid" and the finance views are **records only**: no payments, bank connections, tax
  calculations or accounting. Quotations and orders send no email.
- The assistant is **rule-based and local**. It calls no model and says so in the UI.
- Currency selection changes formatting only; amounts are not converted.
- Pricing is illustrative and nothing can be purchased; the contact and waitlist forms validate and confirm but send nothing.
- No customer logos, testimonials, certifications or uptime claims are shown, because none exist.

## Accessibility, motion and performance

- Semantic landmarks, skip links, labelled form controls with inline errors, `aria-live` for toasts, answers and captions,
  visible focus rings, keyboard-operable menus, dialogs, drawers, tabs, tables and the search combobox.
- `prefers-reduced-motion`: Framer Motion is wrapped in `MotionConfig reducedMotion="user"`, CSS animations are neutralised, and
  the story animation does not autoplay (it opens on the final scene with a scene stepper).
- The story is composed from React, Framer Motion, CSS and SVG only (no video), plays once, pauses when scrolled away, and
  reserves its space so there is no layout shift.
- Charts render after hydration into a fixed-height frame and expose an accessible summary label.

## Next phase

Member workspaces store each record as validated JSON in one table. That keeps the demo's screens and rules unchanged and was
the quickest safe way to give every member real, private, saved data. When the product needs more, this is where it grows:

| Today                                              | Next phase                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `workspace_records` (JSON rows per member)         | Relational tables (`contacts`, `products`, `orders`, `order_lines`, …) with foreign keys, money as integer minor units, and an `organization_id` so several people can share one workspace |
| Business rules run in the browser store            | The same rules as Server Actions inside a database transaction, so no client can bypass them        |
| Selectors compute metrics in the browser           | SQL views or queries behind the same function signatures, so the UI is unchanged                    |
| Per-member workspaces, one owner each              | Organisations with roles, invitations and per-module permissions                                     |
| `lib/demo/copilot.ts` rule-based assistant         | A server route that sends the question to a language model with tool access to the query layer; reuse the `CopilotAnswer` contract the UI already renders |
| Client-side search and notifications               | Server-side queries and Postgres full-text search                                                   |

Suggested order: organisations and roles → relational tables behind the existing selectors → rules as server actions →
AI tooling → integrations (email, payments).

## Credits and trademarks

Research for this proof of concept looked at the public positioning of established ERP and business platforms. No branding,
copy, layouts or assets from those products are used, and OrbitOS is not affiliated with any of them.
