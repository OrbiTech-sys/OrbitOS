# OrbitOS — AI-native business operating system (proof of concept)

OrbitOS is a **working placeholder name** for a simpler, modular business operating system. This repository is a polished,
believable proof of concept: a marketing website plus an interactive demo application, built on **fictional sample data that
lives entirely in the browser**.

> The demo itself still runs on in-browser sample data. Authentication and the admin area (`/sign-in`, `/admin`) run on
> Supabase; see [Supabase](#supabase-auth-and-database). There is no payment or AI service in this phase.

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

Requires Node 22.9+ (the `db:*` scripts use `--env-file-if-exists`). The project uses **Next.js 16** (App Router, Cache Components enabled), **React 19**, **TypeScript** (strict),
**Tailwind CSS v4**, **shadcn/ui** primitives (Radix), **Lucide**, **Framer Motion**, **Recharts**, **React Hook Form + Zod**.

## Supabase (auth and database)

1. Copy `.env.example` to `.env.local` and fill it in (Supabase dashboard → Project Settings → API Keys, and Connect →
   Session pooler connection string). `.env.local` is git-ignored.
2. In Supabase → Authentication → Sign In / Providers, turn off **Allow new users to sign up**. Accounts are created by
   an administrator.
3. `npm run db:setup` applies `supabase/migrations`, creates the super admin from `SUPER_ADMIN_EMAIL` /
   `SUPER_ADMIN_PASSWORD`, and runs `db:check`. Re-running is safe and never resets a changed password.
4. Sign in at `/sign-in`. An account seeded with a temporary password is sent to `/admin/password` until it is changed.

How it is secured:

- **Row Level Security everywhere.** `public.profiles` is deny-by-default: anonymous visitors get nothing, users read their
  own row and may edit only their name, admins read all rows. Roles cannot be changed through the API.
- **No keys in the browser.** All auth runs in Server Actions with the publishable key; session cookies are `httpOnly`.
  The secret key and database URL are used only by the `db:*` scripts.
- **`proxy.ts`** refreshes sessions and guards `/admin` only, so marketing and demo pages stay static. Pages and actions
  re-check the user themselves (`lib/auth/session.ts`).
- Password changes re-verify the current password; a database trigger clears the temporary-password flag only when the
  stored hash actually changes. `?next=` redirects are limited to `/admin` paths.
- `npm run db:check` proves it: it signs in a throwaway user, confirms they see only their own row and cannot promote
  themselves, then deletes them.

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
| `/admin`, `/admin/password`                            | Signed-in area: connection status, accounts, password change |
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
components/
  ui/                   shadcn/ui primitives (Radix) lightly restyled to the OrbitOS design system
  marketing/            homepage sections, story animation, product preview, forms
  demo/                 application shell, module views, dialogs, drawers
  shared/               components used by both: logo, icons, badges, charts, copilot chat
lib/
  content/              marketing content (modules, industries, FAQ, pricing, …)
  demo/                 the typed data layer (see below)
```

### The data layer (`lib/demo`)

| File            | Role                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `types.ts`      | Domain types: contacts, products, orders, quotations, invoices, expenses, projects, tasks, activities   |
| `seed.ts`       | Deterministic, interconnected sample dataset (seeded PRNG + fixed "today", so SSR and client always agree) |
| `selectors.ts`  | Pure functions that compute every dashboard metric, chart series and alert from the records             |
| `store.tsx`     | External store + typed actions (create order, adjust stock, convert quotation, …) with all business rules |
| `copilot.ts`    | Deterministic demo assistant: intent matching → selectors → structured, linkable answers                |
| `settings.ts`   | Persisted local preferences (theme, currency, notification toggles, module visibility)                  |
| `schemas.ts`    | Zod schemas used by the forms                                                                           |

Relationships are real: orders reference customers and products, invoices reference customers and orders, tasks reference
projects, and so on. Dashboard counts, notifications, global search and AI answers are all derived from the same records, so
they can never disagree with each other.

**The demo runs on a fixed date** (13 Oct 2026, `DEMO_TODAY` in `lib/demo/dates.ts`). That keeps overdue/due-today logic
stable, avoids hydration mismatches, and respects Next.js Cache Components (no `Date.now()` during render).

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

- Data is fictional and in memory; refreshing restores the seed data. Only UI preferences use `localStorage`.
- "Mark as paid", invoices and finance views are **illustrative**: no payments, bank connections, tax calculations or accounting.
- The AI copilot is **rule-based and local**. It calls no model and says so in the UI.
- Currency selection changes formatting only; amounts are not converted.
- Pricing is illustrative and nothing can be purchased; forms validate and confirm but send nothing.
- No customer logos, testimonials, certifications or uptime claims are shown, because none exist.

## Accessibility, motion and performance

- Semantic landmarks, skip links, labelled form controls with inline errors, `aria-live` for toasts, answers and captions,
  visible focus rings, keyboard-operable menus, dialogs, drawers, tabs, tables and the search combobox.
- `prefers-reduced-motion`: Framer Motion is wrapped in `MotionConfig reducedMotion="user"`, CSS animations are neutralised, and
  the story animation does not autoplay (it opens on the final scene with a scene stepper).
- The story is composed from React, Framer Motion, CSS and SVG only (no video), plays once, pauses when scrolled away, and
  reserves its space so there is no layout shift.
- Charts render after hydration into a fixed-height frame and expose an accessible summary label.

## Next phase: Drizzle ORM and a real backend

Drizzle is deliberately **not installed or configured** in this phase. This is where it connects:

| Today (POC)                                        | Next phase                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `lib/demo/types.ts` interfaces                     | Drizzle table definitions (`organizations`, `users`, `contacts`, `products`, `orders`, `order_lines`, `quotations`, `invoices`, `expenses`, `projects`, `tasks`, `activities`, `organization_settings`). Money becomes integer minor units; ids become UUIDs; every row gets `organization_id`. |
| `lib/demo/seed.ts` (`SEED_DATA`)                   | A seed script (`drizzle-seed` or SQL) that inserts the same fictional organisation for demos         |
| `lib/demo/selectors.ts`                            | Drizzle queries / views returning the same shapes; keep the function signatures so the UI is unchanged |
| `lib/demo/store.tsx` actions                       | Next.js Server Actions that run the same rules inside `db.transaction(...)`, then revalidate or refresh |
| `lib/demo/settings.ts`                             | `organization_settings` (profile, currency, module visibility) and `user_preferences` (theme, notifications) |
| `lib/demo/copilot.ts`                              | A server route that sends the question to a language model with tool access to the query layer; reuse the `CopilotAnswer` contract the UI already renders |
| `lib/demo/notifications.ts`, `search.ts`           | Server-side queries (and Postgres full-text search for global search)                               |
| Forms (`lib/demo/schemas.ts`)                      | Shared Zod schemas validated again on the server                                                    |

Suggested order: schema + migrations → read queries behind the existing selectors → mutations as server actions → auth and
roles → AI tooling → integrations. Add authentication and organisation scoping **before** persisting any real data.

## Credits and trademarks

Research for this proof of concept looked at the public positioning of established ERP and business platforms. No branding,
copy, layouts or assets from those products are used, and OrbitOS is not affiliated with any of them.
