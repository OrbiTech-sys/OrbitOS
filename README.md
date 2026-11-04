# OrbitOS — a business operating system by The OrbiTech Solution

OrbitOS is a modular business operating system: a public website, a public interactive demo, and real accounts with
their own saved workspaces.

- **The website** (`/`, `/pricing`, `/product/…`, …) reads its content from the database. A super admin edits the menu
  bar, every product and solution, the prices and the rest of the wording from **Settings → Website**.
- **`/demo`** is the public demo: fictional sample data that lives in the browser. It needs no account and resets on refresh.
- **`/workspace`** is a signed-in member's own workspace: the same screens running on *their* records, saved to Supabase.
- There is no separate admin area. Admins and super admins use the same workspace as everyone, and manage things from
  **Settings**.

## Before you go live

These need a decision or a setting that only the business can supply:

1. **Turn off public sign-up in Supabase** (Authentication → Sign In / Providers → *Allow new users to sign up*). The
   database already refuses such accounts, but with the setting on, a refused attempt can still send a confirmation email.
2. **Set the real prices** in Settings → Website → Pricing. The built-in $19 / $49 / Custom are placeholders.
3. **Have the Privacy and Terms pages reviewed** by your legal adviser, then edit them in Settings → Website → Legal pages.
4. **Set the server's environment** on your host: everything in `.env.example` except the `SUPABASE_DB_URL` and
   `SUPER_ADMIN_*` values, which only the `db:*` scripts use.
5. **Decide how you will answer enquiries.** Contact and access requests arrive in Settings → Inbox; no email is sent to
   anyone, because no mail service is connected.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command                 | What it does                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`           | Start the development server (Turbopack)                                            |
| `npm run build`         | Production build (type-checks and prerenders routes)                                |
| `npm run start`         | Serve the production build                                                          |
| `npm run lint`          | ESLint (Next.js core-web-vitals + TypeScript rules)                                 |
| `npm run typecheck`     | `tsc --noEmit`                                                                      |
| `npm run db:setup`      | Migrate, seed the super admin, then run the checks                                  |
| `npm run db:check`      | End-to-end connection and security check                                            |
| `npm run test:content`  | Website content: valid defaults, safe links, a bad save can't break the site        |
| `npm run test:workspace`| Workspace rules, edit and delete, the save queue, and the real database path        |
| `npm run test:access`   | Drives the running app as each role over HTTP: redirects, permissions, forms        |
| `npm test`              | All three self-tests (`test:access` needs the app running)                          |

The `db:check`, `test:workspace` and `test:access` scripts create throwaway accounts in your Supabase project and delete
them afterwards. `test:access` also briefly edits the website's brand section, then restores it.

Requires Node 22.9+ (the `db:*` scripts use `--env-file-if-exists`). The project uses **Next.js 16** (App Router, Cache
Components enabled), **React 19**, **TypeScript** (strict), **Tailwind CSS v4**, **shadcn/ui** primitives (Radix),
**Lucide**, **Framer Motion**, **Recharts**, **React Hook Form + Zod**.

## Supabase (auth and database)

1. Copy `.env.example` to `.env.local` and fill it in (Supabase dashboard → Project Settings → API Keys, and Connect →
   Session pooler connection string). `.env.local` is git-ignored.
2. In Supabase → Authentication → Sign In / Providers, turn off **Allow new users to sign up**.
3. `npm run db:setup` applies `supabase/migrations`, creates the super admin from `SUPER_ADMIN_EMAIL` /
   `SUPER_ADMIN_PASSWORD`, and runs `db:check`. Re-running is safe and never resets a changed password.
4. Sign in at `/sign-in`. An account with a temporary password is sent to `/account/password` until it is changed. Then
   everyone lands in `/workspace`.
5. Add everyone else in **Settings → Users & access**. Each new user gets a one-time temporary password (shown once, to
   share privately) and must replace it at first sign-in. No email setup is needed.

## Who can do what

Defined in `lib/auth/permissions.ts`, enforced in every Server Action, and again by Row Level Security in the database.

| | Super admin | Admin | Member |
| --- | :-: | :-: | :-: |
| Use their own workspace (add, edit, delete their records) | ✔ | ✔ | ✔ |
| Change their own name and password | ✔ | ✔ | ✔ |
| Add users | any role | members | – |
| Edit name and email; deactivate, reactivate, delete | anyone but themselves | members | – |
| See each user's storage use | ✔ | ✔ | – |
| Read and handle website enquiries (Inbox) | ✔ | ✔ | – |
| Change roles, reset passwords, set storage limits | ✔ | – | – |
| See the audit log | ✔ | – | – |
| Edit the public website | ✔ | – | – |
| See what another person's records contain | – | – | – |

## Editing the website

**Settings → Website** (super admins) has a form for every section:

| Section | What it controls |
| --- | --- |
| Navigation | The menu bar: its items, order, labels, links and buttons |
| Product | Each module: name, page address, summary, icon, status, wording, demo link, shown or hidden |
| Solutions, Industries | The same for each solution and industry page; add, remove and reorder |
| Pricing | Plans, prices, what each includes, the highlighted plan, the comparison table |
| Homepage | The headline, section introductions, problems, straight answers, FAQ, closing banner |
| Resources, Contact pages, Legal pages | The rest of the site's wording |
| Brand & footer | Product and company name, search description, footer |

Each section saves on its own and goes live at once; **Reset to default** returns it to the built-in version. Switching
something off removes it from every menu, and its page returns "not found".

How it works: a section is one row of validated JSON in `public.site_content` (`lib/content/schema.ts`). A section without
a row uses the default in `lib/content/`. Pages read `getSiteContent()` (`lib/content/store.ts`), which is cached and
expired by the save, so the public site stays fast and static. Anyone may read the table; only an active super admin may
write to it, and the database decides that. If a stored section stops being valid, or the database is unreachable, the site
falls back to the defaults rather than breaking. To change what is editable, edit
`components/admin/website/definitions.ts` and the matching schema; `npm run test:content` fails if a stored field has no form.

## Website forms and the Inbox

The contact and access-request forms save to `public.site_submissions` through `lib/marketing/actions.ts`. Visitors have no
access to the table: the Server Action validates each message, ignores bots that fill a hidden field, and allows 5 messages
an hour from one network address (200 from everyone), then inserts with the secret key. The address itself is never stored,
only a salted hash. Admins handle messages under **Settings → Inbox**.

## How data is secured

- **Row Level Security everywhere.** Everything is deny-by-default. Users read their own profile and may edit only their
  name; admins read all profiles; roles can't be changed through the API. Workspace rows are readable and writable only by
  their owner, and only while the account is active.
- **Public sign-up is blocked in the database.** Every new auth user must carry a flag only the secret key can set
  (`20261104120000_block_public_signup.sql`), whatever the dashboard setting says.
- **No keys in the browser.** All auth runs in Server Actions with the publishable key; session cookies are `httpOnly`.
  The secret key is used server-side only, after checking the caller. The database URL is used only by the `db:*` scripts.
- **The server has the final say.** Every Server Action re-reads the session and checks permissions, so hiding a button is
  never the only protection. `npm run test:access` calls the actions directly to prove it.
- **Temporary passwords lock an account down.** Until it is replaced, an account can't open its workspace, save, or use any
  admin action.
- **Deactivation is immediate.** It blocks sign-in and, through RLS, removes access even for a session that is still open. A
  database guard always keeps at least one active super admin.
- **Signing out clears the browser.** Leaving a workspace does a full page load, so its records leave the tab's memory and the
  Back button can't bring them back on a shared computer.
- **Password guessing is slowed.** After 8 wrong passwords for an account from one address (or 30 overall) further attempts
  are stopped for 15 minutes (`lib/auth/rate-limit.ts`), on top of Supabase's own limit. Passwords are at least 12 characters,
  and changing one requires the current one. Counted per server instance, so several instances each keep their own count.
- **Audit log.** User management and website edits are recorded in `public.audit_log`, append-only and readable by super admins.
- **Security headers.** A content security policy, HSTS, `X-Frame-Options`, `nosniff` and others (`next.config.ts`).
  `?next=` redirects are limited to `/workspace` paths.
- **`proxy.ts`** refreshes sessions and guards `/workspace` and `/account` only, so marketing and demo pages stay static.

`npm run db:check` proves the database side: it signs in a throwaway user and confirms they see only their own row, can't
promote themselves, and so on, then deletes them.

## Member workspaces

Every member gets a private workspace: CRM, sales, orders, inventory, finance, projects, team, analytics, the assistant and
settings, all on their own records. It reuses the demo's screens, so there is one set of business rules for both.

- **Storage.** Each record is one row in `public.workspace_records` (`owner_id`, `kind`, `id`, JSON `data`). Rows are small
  (32 KB max) and each member has a storage limit (50 MB by default; a super admin can change it). A trigger keeps
  `public.workspace_usage` current and refuses writes past the limit.
- **Saving.** Screens change a local store; the changes are queued and saved in the background in small batches
  (`lib/workspace/sync.ts`) through one Server Action (`lib/workspace/actions.ts`). The server checks who is calling, validates
  every record against `lib/workspace/schemas.ts`, and writes as the member, so the database has the final say. Failures retry
  automatically; the header shows *Saved* / *Saving…* / *Not saved*, and leaving with unsaved changes asks first.
- **Editing and deleting.** Every kind of record can be edited and deleted, with rules that keep the data consistent: a contact
  with orders can't be deleted until they are, deleting an order returns its stock, deleting a project deletes its tasks, and
  removing a team member passes their work to the workspace's owner.
- **Team members** are the people a member tracks work against. They don't get a sign-in: that takes an account, created under
  Users & access. Each workspace belongs to one account; shared workspaces are the next phase.
- **What admins see.** Only counts and sizes. Admins can't read a member's records.
- **Deactivating** a member cuts off reads and writes at once and keeps their data. **Deleting** a member deletes their workspace.

Limits to know about: two tabs open on the same record overwrite each other (last save wins per record), and a forgotten password
has to be reset by a super admin, because no mail service is connected.

## Routes

| Route                                                  | Purpose                                                     |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| `/`                                                    | Homepage (story animation, previews, pricing, FAQ)          |
| `/product/[slug]`, `/solutions/[slug]`                 | One page per module and per solution                        |
| `/industries`, `/industries/[slug]`                    | Industry overview and one page per industry                 |
| `/pricing`, `/resources`                               | Plans and comparison; guides and what's next                |
| `/contact`, `/waitlist`                                | Forms, saved to the Inbox                                   |
| `/privacy`, `/terms`                                   | Legal pages                                                 |
| `/sign-in`                                             | Email + password sign-in (no public sign-up)                |
| `/account/password`, `/account/deactivated`            | Change your password; the notice for a deactivated account  |
| `/workspace` and `/workspace/*`                        | A member's own workspace                                    |
| `/workspace/settings/users`                            | Admins: add, edit, deactivate, delete users; see storage    |
| `/workspace/settings/inbox`                            | Admins: website enquiries                                   |
| `/workspace/settings/website`                          | Super admins: edit the website                              |
| `/demo` and `/demo/*`                                  | The public demo                                             |

## Project layout

```
app/
  (marketing)/…         public website, reading its content from lib/content
  demo/…                demo application routes (shared shell layout)
  workspace/…           a member's own workspace (same screens, loaded from and saved to the database)
  account/…             password change and deactivated notice
components/
  ui/                   shadcn/ui primitives (Radix) lightly restyled to the OrbitOS design system
  marketing/            homepage sections, story animation, product preview, forms
  demo/                 application shell, module views, dialogs, drawers (used by /demo and /workspace)
  workspace/            workspace shell, save indicator, storage and account cards, sign-out
  admin/                users, inbox and the website editor (admin/website)
  auth/                 sign-in and password forms
  shared/               components used by both: logo, icons, badges, charts, copilot chat
lib/
  content/              the website's content: schemas, built-in defaults, reading and saving
  marketing/            the public forms and the inbox
  demo/                 the typed data layer (see below)
  workspace/            records ⇄ rows, validation schemas, save queue, loading, environment (demo vs workspace)
  auth/, supabase/      sessions, permissions, user-management actions, Supabase clients and types
scripts/
  db/                   migrate, seed and check the database
  content/, workspace/, access/   self-tests
```

### The data layer (`lib/demo`)

| File            | Role                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `types.ts`      | Domain types: contacts, products, orders, quotations, invoices, expenses, projects, tasks, activities   |
| `seed.ts`       | Deterministic, interconnected sample dataset (seeded PRNG + fixed "today", so SSR and client always agree) |
| `selectors.ts`  | Pure functions that compute every dashboard metric, chart series and alert from the records             |
| `store.tsx`     | External store + typed actions with all business rules; a `StoreConfig` switches between the demo and a workspace |
| `copilot.ts`    | Rule-based assistant: intent matching → selectors → structured, linkable answers                        |
| `settings.tsx`  | Preferences: browser-only in the demo, saved with the member's records in a workspace                   |
| `schemas.ts`    | Zod schemas used by the forms                                                                           |

**The demo runs on a fixed date** (13 Oct 2026, `DEMO_TODAY` in `lib/demo/dates.ts`). That keeps overdue/due-today logic stable,
avoids hydration mismatches, and respects Next.js Cache Components. A workspace follows the member's own calendar instead.

## What is not connected yet (and the product says so)

- **Payments and accounting.** Invoices, "Mark as paid" and the finance views are records only: no payments, bank connections,
  tax calculations or certified accounts. There is no online checkout.
- **Email.** Quotations, orders and invoices send no email, and enquiries don't notify anyone.
- **AI.** The assistant is rule-based and local. It calls no model and says so in the UI.
- **Currency.** Choosing a currency changes formatting only; amounts are not converted.
- **Integrations.** None exist yet.

## Accessibility, motion and performance

- Semantic landmarks, skip links, labelled form controls with inline errors, `aria-live` for toasts, answers and captions,
  visible focus rings, keyboard-operable menus, dialogs, drawers, tabs, tables and the search combobox.
- `prefers-reduced-motion`: Framer Motion is wrapped in `MotionConfig reducedMotion="user"`, CSS animations are neutralised, and
  the story animation does not autoplay.
- The story is composed from React, Framer Motion, CSS and SVG only (no video), plays once, pauses when scrolled away, and
  reserves its space so there is no layout shift.
- Charts render after hydration into a fixed-height frame and expose an accessible summary label.

## Next phase

| Today                                              | Next phase                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `workspace_records` (JSON rows per member)         | Relational tables with foreign keys, money as integer minor units, and an `organization_id` so several people can share one workspace |
| Business rules run in the browser store            | The same rules as Server Actions inside a database transaction, so no client can bypass them        |
| Selectors compute metrics in the browser           | SQL views or queries behind the same function signatures, so the UI is unchanged                    |
| Per-member workspaces, one owner each              | Organisations with roles, invitations and per-module permissions                                     |
| `lib/demo/copilot.ts` rule-based assistant         | A server route that sends the question to a language model with tool access to the query layer; reuse the `CopilotAnswer` contract the UI already renders |
| No mail service                                    | Password reset by email, enquiry notifications, sending quotations and invoices                     |

## Credits and trademarks

Research looked at the public positioning of established ERP and business platforms. No branding, copy, layouts or assets from
those products are used, and OrbitOS is not affiliated with any of them.
