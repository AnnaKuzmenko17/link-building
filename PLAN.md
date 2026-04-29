# Implementation Plan: Linkbuilding Management System

## How to Use This Document

Work through phases sequentially. Each phase builds on the previous one. Within a phase, complete steps in order — later steps may depend on earlier ones. Mark steps done as you go.

Each step is written as a direct instruction to Claude Code.

---

## Phase 1 — Project Foundation

### Step 1.1 — Initialize Next.js project

- Create a new Next.js project with the App Router and TypeScript enabled.
- Enable Tailwind CSS during setup.
- Remove all default boilerplate content from `app/page.tsx`.

### Step 1.2 — Install and configure shadcn/ui

- Initialize shadcn/ui (`npx shadcn@latest init`).
- Choose the default style and CSS variables.
- Install these components upfront — they will be used throughout the entire app:
  `button`, `input`, `label`, `form`, `select`, `dialog`, `alert-dialog`, `sheet`, `badge`, `table`, `skeleton`, `sonner`, `sidebar`, `dropdown-menu`, `combobox`, `avatar`, `separator`, `card`, `tabs`, `tooltip`

### Step 1.3 — Install core dependencies

```
react-hook-form
zod
@hookform/resolvers
@tanstack/react-table
@supabase/supabase-js
@supabase/ssr
```

### Step 1.4 — Connect Supabase project

- Create a Supabase project.
- Add environment variables to `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, for admin operations)
- Create `lib/supabase/client.ts` — browser Supabase client.
- Create `lib/supabase/server.ts` — server Supabase client (using `@supabase/ssr`).
- Create `lib/supabase/middleware.ts` — session refresh logic.

### Step 1.5 — Configure Next.js middleware

- Create `middleware.ts` at the project root.
- Refresh the Supabase session on every request.
- Redirect unauthenticated users to `/login` for any route under `/dashboard`.
- Redirect authenticated users away from `/login` to their role-appropriate dashboard.

### Step 1.6 — Define TypeScript types

Create `types/index.ts` with all shared types derived from the database schema:

- `Role`: `'client' | 'manager' | 'copywriter' | 'sourcer' | 'admin'`
- `UserStatus`: `'pending' | 'active' | 'disabled'`
- `SiteStatus`: `'pending' | 'active' | 'archived'`
- `OrderStatus`: `'new' | 'in_progress' | 'content_sent' | 'needs_changes' | 'content_approved' | 'published' | 'completed' | 'canceled'`
- `InvoiceStatus`: `'draft' | 'sent' | 'paid'`
- `ChatCategory`: `'support' | 'sales' | 'general'`
- `MessageStatus`: `'unread' | 'read'`
- Full entity types: `User` (include `manager_id: string | null`), `Site`, `Order`, `CartItem`, `ChangeRequest`, `Invoice`, `InvoiceItem`, `Chat`, `ChatParticipant`, `Message`

---

## Phase 2 — Database

### Step 2.1 — Create database tables

Run the following migrations in the Supabase SQL editor in order:

1. **`users` profile table** — extends `auth.users`. Fields: `id` (references `auth.users`), `email`, `role`, `status`, `first_name`, `last_name`, `manager_id` (references `users`, nullable — only used when `role = 'client'`), `created_at`.
2. **`sites`** — `id`, `url`, `sourcer_id` (references `users`), `status`, `created_at`, `updated_at`.
3. **`cart_items`** — `id`, `client_id` (references `users`), `site_id` (references `sites`), `created_at`.
4. **`orders`** — `id`, `client_id`, `site_id`, `copywriter_id` (nullable), `sourcer_id`, `status`, `publish_month`, `content` (text, nullable), `published_url` (nullable), `created_at`, `updated_at`.
5. **`change_requests`** — `id`, `order_id`, `comment`, `created_by`, `created_at`.
6. **`invoices`** — `id`, `client_id`, `status`, `billing_period_start`, `billing_period_end`, `created_at`, `updated_at`.
7. **`invoice_items`** — `id`, `invoice_id`, `order_id`, `amount`.
8. **`chats`** — `id`, `category`, `created_at`.
9. **`chat_participants`** — `id`, `chat_id`, `user_id`.
10. **`messages`** — `id`, `chat_id`, `sender_id`, `body`, `status`, `created_at`.

### Step 2.2 — Create database triggers

1. **Auto-create user profile on signup** — a trigger on `auth.users` that inserts a row into the public `users` table after a new auth user is created.
2. **Update `updated_at` timestamps** — a reusable trigger function that sets `updated_at = now()` on update. Apply to `sites`, `orders`, `invoices`.

### Step 2.3 — Set up Row Level Security (RLS)

Enable RLS on every table. Implement the following policies:

**`users` table:**
- `admin`: full read/write access.
- `manager`: read all users; update `client`, `copywriter`, `sourcer` records only.
- `sourcer`, `copywriter`, `client`: read own record only.

**`sites` table:**
- `admin`: full access.
- `manager`: read all.
- `sourcer`: read own sites where `status != 'archived'`; insert; update own sites where `status != 'archived'`.

**`cart_items` table:**
- `client`: full access to own rows (`client_id = auth.uid()`).

**`orders` table:**
- `admin`, `manager`: full access.
- `client`: read/update own orders (`client_id = auth.uid()`).
- `copywriter`: read/update own assigned orders (`copywriter_id = auth.uid()`).
- `sourcer`: read orders where `sourcer_id = auth.uid()`.

**`change_requests` table:**
- `client`: insert where `order.client_id = auth.uid()`; read own.
- `copywriter`: read for assigned orders.
- `manager`, `admin`: full access.

**`invoices` table:**
- `admin`, `manager`: full access.
- `client`: read own invoices where `status IN ('sent', 'paid')`.

**`invoice_items` table:**
- Follows same rules as `invoices` via join.

**`chats` / `chat_participants` / `messages` tables:**
- All authenticated users: read/write access to chats they participate in (use `chat_participants` as the gate).

### Step 2.4 — Generate Supabase TypeScript types

Run `supabase gen types typescript` to generate database types. Save output to `types/database.types.ts`. Use these as the source of truth for all database interactions.

---

## Phase 3 — Authentication

### Step 3.1 — Build Login screen

- Route: `/login`
- Use shadcn/ui `<Card>`, `<Form>`, `<Input>`, `<Button>`.
- Fields: email, password.
- On submit: call Supabase `signInWithPassword`.
- On success: read the user's role from the `users` table and redirect to the correct dashboard (`/dashboard/client`, `/dashboard/manager`, etc.).
- On error: show a generic error message using shadcn/ui `<Sonner>` toast — do not specify whether email or password was wrong.

### Step 3.2 — Build Set Password screen (first login)

- Route: `/auth/set-password`
- Shown after first login with a temporary password.
- Fields: new password, confirm password.
- On submit: call Supabase `updateUser` to set the new password. Set user `status = 'active'` in the `users` table. Redirect to the role dashboard.

### Step 3.3 — Build Forgot Password screen

- Route: `/auth/forgot-password`
- Fields: email.
- On submit: call Supabase `resetPasswordForEmail`.
- Always show a neutral success message regardless of whether the email exists.
- If the email is not found in the `users` table, show: *"No account found with that email."*
- Provide a link back to `/login`.

### Step 3.4 — Build Reset Password screen

- Route: `/auth/reset-password`
- Supabase appends a token to the URL — handle session recovery via `onAuthStateChange` with event `PASSWORD_RECOVERY`.
- Fields: new password, confirm password.
- On submit: call Supabase `updateUser`.
- On success: show success message with link to `/login`.

---

## Phase 4 — Shell & Navigation

### Step 4.1 — Create dashboard layout

- Create `app/dashboard/layout.tsx`.
- Use shadcn/ui `<Sidebar>` as the persistent left navigation.
- Read the user's role from the Supabase session and render only the relevant nav items per role (see table below).
- Include a user avatar/name in the sidebar footer with a **Logout** button that calls `supabase.auth.signOut()`.

**Sidebar nav items per role:**

| Role | Nav Items |
|---|---|
| `client` | Orders, Cart, Invoices, Chat |
| `manager` | Orders, Sites, Users, Invoices, Earnings, Chat |
| `copywriter` | Orders, Chat |
| `sourcer` | Sites, Earnings, Chat |
| `admin` | Orders, Sites, Users, Invoices, Earnings, Chat |

### Step 4.2 — Create role-based dashboard home pages

Create a simple dashboard home page for each role at:
- `app/dashboard/client/page.tsx`
- `app/dashboard/manager/page.tsx`
- `app/dashboard/copywriter/page.tsx`
- `app/dashboard/sourcer/page.tsx`
- `app/dashboard/admin/page.tsx`

Each page should display a welcome message and a summary of relevant metrics (e.g., open orders count, pending invoices). Keep these minimal for now — they can be enriched later.

### Step 4.3 — Create shared UI components

Build these reusable components in `components/ui/` or `components/shared/`:

- `<StatusBadge status={...} />` — renders a shadcn/ui `<Badge>` with the correct color for each status value (reference the status color table in the PRD).
- `<DataTable columns={...} data={...} />` — a generic table wrapper using `@tanstack/react-table` and shadcn/ui `<Table>`.
- `<ConfirmDialog title description onConfirm />` — wraps shadcn/ui `<AlertDialog>` for reuse across all confirmation flows.
- `<PageHeader title action? />` — page title + optional action button (e.g., "Invite User").
- `<EmptyState message />` — shown when a table has no results.

---

## Phase 5 — User Management

### Step 5.1 — All Users screen

- Route: `app/dashboard/[role]/users/page.tsx` (accessible to `manager` and `admin`).
- Use `<DataTable>` with columns: name, email, role, status, assigned manager (shown only for rows where `role = 'client'`), actions.
- Fetch users via a Server Action with appropriate filters for the current user's role.
- Add `<StatusBadge>` in the status column.
- Add filter controls: role selector (`<Select>`), status selector, search input — all using shadcn/ui components.

### Step 5.2 — User Details screen

- Route: `app/dashboard/[role]/users/[id]/page.tsx`
- Display user fields and status.
- If the target user has `role = 'client'`, display their assigned manager name.
- Show action buttons conditionally based on the viewer's role and the target user's current status:
  - **Edit** (manager for non-admin/manager, admin for all)
  - **Resend Invite** (status = `pending` only)
  - **Disable / Activate** (admin only; hidden for current user)
  - **Assign Manager** (admin only; visible only when target `role = 'client'`)

### Step 5.3 — Invite User flow

- Trigger: **Invite User** button on All Users screen.
- Use shadcn/ui `<Sheet>` (side panel) or `<Dialog>`.
- Form fields: email, role (filtered by inviter's permissions).
- **If the selected role is `client`:** render an additional **Assign Manager** field.
  - If the inviter is a `manager`: this field is pre-filled with the inviter's own name and is read-only (no selection needed).
  - If the inviter is an `admin`: this field is a required `<Select>` listing all active managers. The form cannot be submitted without a selection.
- Validation with `zod`: email format, role is within allowed set, `manager_id` is required when `role = 'client'`.
- Server Action:
  1. Validate email uniqueness.
  2. Determine `manager_id`: if inviter is `manager`, use `auth.uid()`; if inviter is `admin`, use the selected manager id.
  3. Create `auth` user with Supabase Admin API.
  4. Insert into `users` table with `status = 'pending'` and `manager_id` set.
  5. Send invite email via Supabase.

### Step 5.4 — Edit User flow

- Trigger: **Edit** button on User Details.
- Use shadcn/ui `<Sheet>` with pre-filled form.
- Editable fields: first name, last name, email (validate uniqueness on change), role.
- Server Action: update `users` table row.

### Step 5.5 — Resend Invite flow

- Trigger: **Resend Invite** button (visible only when `status = 'pending'`).
- Show `<ConfirmDialog>`.
- On confirm: call Supabase Admin API to resend the invite email.

### Step 5.6 — Disable User flow

- Trigger: **Disable** button (admin only, hidden for current user).
- **If target role is `copywriter` and has orders with `status IN ('new', 'in_progress', 'content_sent', 'needs_changes', 'content_approved')`:**
  - Open **Reassign Orders** `<Sheet>`.
  - For each active order, show a `<Select>` to pick a replacement copywriter.
  - On save: update `copywriter_id` on all listed orders, then set user `status = 'disabled'`.
- **If target role is `sourcer`:**
  - Show `<ConfirmDialog>`.
  - On confirm: set `sourcer_id = null` on all sites owned by this sourcer. Set user `status = 'disabled'`.
- **All other roles (no active orders):**
  - Show `<ConfirmDialog>`.
  - On confirm: set `status = 'disabled'`.

### Step 5.7 — Activate User flow

- Trigger: **Activate** button (admin only).
- Show `<ConfirmDialog>`.
- On confirm: set `status = 'active'`.

### Step 5.8 — Assign Manager flow

- Trigger: **Assign Manager** button on User Details (admin only, visible when target `role = 'client'`).
- Open a small `<Dialog>` with a single required `<Select>` field listing all active managers, pre-selected with the current `manager_id`.
- On save: Server Action updates `manager_id` on the client's `users` row.
- If a Sales Chat exists for this client, add the newly assigned manager as a `chat_participant` if they are not already one. Do not remove the previous manager from the chat.

---

## Phase 6 — Profile

### Step 6.1 — View Profile screen

- Route: `app/dashboard/[role]/profile/page.tsx`
- Display: first name, last name, email, role.
- Buttons: **Edit Profile**, **Change Password**.

### Step 6.2 — Edit Profile flow

- Trigger: **Edit Profile** button.
- Open shadcn/ui `<Sheet>` with pre-filled form.
- Editable fields: first name, last name, email.
- Server Action: update own `users` row.

### Step 6.3 — Change Password flow

- Separate card or `<Dialog>` on the profile page.
- Fields: current password, new password, confirm new password.
- Server Action: verify current password with Supabase `signInWithPassword`, then call `updateUser` with new password.

---

## Phase 7 — Sites

### Step 7.1 — All Sites screen

- Route: `app/dashboard/[role]/sites/page.tsx`
- Roles: `sourcer`, `manager`, `admin`.
- Use `<DataTable>` with columns: URL, sourcer, status, created date, actions.
- Apply RLS-compatible filters: sourcer sees only own non-archived sites; manager/admin see all.
- Filter controls: status, URL search, sourcer (manager/admin only).

### Step 7.2 — View Site screen

- Route: `app/dashboard/[role]/sites/[id]/page.tsx`
- Display all site fields and sourcer info.
- Conditionally show action buttons: **Edit Site** (sourcer for own, admin for all), **Archive / Unarchive** (admin only).

### Step 7.3 — Add Site flow

- Route: `app/dashboard/sourcer/sites/new/page.tsx`
- Full-page form (not a dialog — sourcer's primary action).
- Fields: URL, any other site metadata defined in the schema.
- Server Action: validate data → insert site with `sourcer_id = auth.uid()`, `status = 'pending'`.

### Step 7.4 — Edit Site flow

- Trigger: **Edit Site** button.
- Use shadcn/ui `<Sheet>` with pre-filled form.
- Server Action: update site fields → reset `status = 'pending'`.
- Show a notice to the user: *"Saving will reset this site to Pending for re-approval."*

### Step 7.5 — Archive / Unarchive flow

- Trigger: **Archive Site** or **Unarchive Site** button (admin only).
- Show `<ConfirmDialog>` with appropriate message.
- Server Action: update `status` accordingly.

---

## Phase 8 — Client: Cart & Orders

### Step 8.1 — Site Catalog screen (client)

- Route: `app/dashboard/client/sites/page.tsx`
- Shows all active sites.
- Use `<DataTable>` with an **Add to Cart** button per row.
- Highlight sites already in the client's cart (disable the button or change label to "In Cart").
- Server Action for Add to Cart: insert into `cart_items`.

### Step 8.2 — Cart screen

- Route: `app/dashboard/client/cart/page.tsx`
- List all cart items for the current client.
- For each item, show site info and a `<Select>` to choose a publish month.
- **Remove** button per item (deletes the `cart_item`).
- **Create Orders** button (disabled if any item has no month selected).
- Server Action: create one `order` per cart item (`status = 'new'`), then delete all cart items.

### Step 8.3 — All Orders screen (client)

- Route: `app/dashboard/client/orders/page.tsx`
- `<DataTable>` with columns: site, status, publish month, created date, actions.
- Filter by status.
- Action buttons per row (conditional on status):
  - `new` → **Edit**, **Cancel**
  - `content_sent` → **Review**

### Step 8.4 — Edit Order flow (client)

- Trigger: **Edit** on an order with `status = 'new'`.
- `<Sheet>` with editable fields (e.g., publish month, notes).
- Server Action: update the order.

### Step 8.5 — Cancel Order flow (client)

- Trigger: **Cancel** on an order with `status = 'new'`.
- Show `<ConfirmDialog>`.
- Server Action: set `status = 'canceled'`.

### Step 8.6 — Review Content flow (client)

- Trigger: **Review** on an order with `status = 'content_sent'`.
- Route or `<Sheet>`: display the submitted content in read-only format.
- Two action buttons: **Approve** and **Needs Changes**.
- **Approve** → Server Action: set `status = 'content_approved'`.
- **Needs Changes** → open a `<Dialog>` with a comment textarea → Server Action: insert `change_request`, set `status = 'needs_changes'`.

---

## Phase 9 — Manager & Admin: Order Management

### Step 9.1 — All Orders screen (manager/admin)

- Route: `app/dashboard/manager/orders/page.tsx` and `app/dashboard/admin/orders/page.tsx`
- `<DataTable>` with columns: site, client, copywriter, status, publish month, actions.
- Filter by: status, client, copywriter, publish month.
- Action buttons per row (conditional on status):
  - No copywriter assigned → **Assign Copywriter**
  - Copywriter assigned → **Reassign Copywriter**
  - `status = 'content_approved'` → **Publish**

### Step 9.2 — View Order screen (manager/admin)

- Route: `app/dashboard/[role]/orders/[id]/page.tsx`
- Display all order fields, content (if exists), change requests, and publication URL (if published).

### Step 9.3 — Assign Copywriter flow

- Trigger: **Assign Copywriter** button.
- `<Sheet>` with a `<Select>` listing active copywriters.
- Server Action: set `copywriter_id`, set `status = 'in_progress'`.

### Step 9.4 — Reassign Copywriter flow

- Trigger: **Reassign Copywriter** button.
- Same `<Sheet>` as above, pre-selected with current copywriter.
- Server Action: update `copywriter_id` only (do not change status).

### Step 9.5 — Publish Order flow

- Trigger: **Publish** on an order with `status = 'content_approved'`.
- `<Sheet>` with a URL input field.
- Validate URL format with `zod`.
- Server Action: save `published_url`, set `status = 'published'`.

---

## Phase 10 — Copywriter

### Step 10.1 — All Orders screen (copywriter)

- Route: `app/dashboard/copywriter/orders/page.tsx`
- Shows only orders where `copywriter_id = auth.uid()`.
- Columns: site, status, publish month, actions.
- Action buttons conditional on status:
  - `in_progress` → **Create Content**
  - `needs_changes` → **Edit Content** (show change request comment as a visible note)
  - Content saved but not submitted → **Submit**

### Step 10.2 — Create / Edit Content flow

- Trigger: **Create Content** or **Edit Content**.
- Full-page route or large `<Sheet>`.
- Route: `app/dashboard/copywriter/orders/[id]/content/page.tsx`
- Form with a rich text or textarea field for the content body.
- If `status = 'needs_changes'`: show the client's change request comment above the editor in a highlighted `<Card>`.
- **Save** button: Server Action saves content without changing status.
- **Submit** button: Server Action saves content and sets `status = 'content_sent'`.

---

## Phase 11 — Invoices

### Step 11.1 — All Invoices screen

- Route: `app/dashboard/[role]/invoices/page.tsx`
- Roles: `client` (own, status = sent/paid), `manager`, `admin` (all).
- `<DataTable>` with columns: client (manager/admin), billing period, status, total amount, actions.
- Filter by: status, client (manager/admin), billing period.

### Step 11.2 — View Invoice screen

- Route: `app/dashboard/[role]/invoices/[id]/page.tsx`
- Display invoice header (client, billing period, status) and a table of invoice items (site, order, amount).
- Action buttons conditional on role and status:
  - `draft` → **Edit** (manager/admin), **Send Invoice** (manager/admin)
  - `sent` → **Mark as Paid** (manager/admin), **Download** (all with access)
  - `paid` → **Download** (all with access)

### Step 11.3 — Edit Invoice flow

- Trigger: **Edit** on a `draft` invoice.
- `<Sheet>` with editable fields: billing period dates, per-item amounts.
- Server Action: update `invoices` and `invoice_items`.

### Step 11.4 — Send Invoice flow

- Trigger: **Send Invoice**.
- Show `<ConfirmDialog>`.
- Server Action: set `status = 'sent'`.

### Step 11.5 — Mark as Paid flow

- Trigger: **Mark as Paid**.
- Show `<ConfirmDialog>`.
- Server Action: set invoice `status = 'paid'` → set all associated orders `status = 'completed'`.

### Step 11.6 — Download PDF

- Trigger: **Download** button.
- Server Route Handler generates a PDF (use a library such as `@react-pdf/renderer` or `puppeteer`).
- Return the file as a downloadable response.

### Step 11.7 — Automatic Invoice Creation (system job)

- Implement as a Next.js Route Handler at `app/api/cron/create-invoices/route.ts`.
- Protect with a secret header checked against an env variable (`CRON_SECRET`).
- Logic: query all `published` orders grouped by `client_id`; for each client, create one `invoice` and corresponding `invoice_items`; set invoice `status = 'draft'`.
- Configure your hosting platform (e.g., Vercel Cron) to call this endpoint monthly.

---

## Phase 12 — Earnings

### Step 12.1 — Earnings screen

- Route: `app/dashboard/[role]/earnings/page.tsx`
- Roles: `sourcer` (own), `manager`, `admin` (all).
- Display a summary table: site, order, publish month, amount, status.
- Filter by: date range, site, status.
- For sourcer: only show rows where `order.sourcer_id = auth.uid()`.

---

## Phase 13 — Chat

### Step 13.1 — All Chats screen

- Route: `app/dashboard/[role]/chat/page.tsx`
- List all chats the current user participates in, sorted by most recent message.
- Each row shows: chat category, participants (truncated), last message preview, unread count.
- Clicking a chat opens the thread.

### Step 13.2 — Chat Thread screen

- Route: `app/dashboard/[role]/chat/[id]/page.tsx`
- Display messages in chronological order.
- Mark messages as `read` when the user views the thread (Server Action or Supabase Realtime).
- Message input at the bottom with a **Send** button.
- Server Action for send: insert `message` with `status = 'unread'`.

### Step 13.3 — Realtime updates

- Use Supabase Realtime to subscribe to new messages in the current chat.
- On new message: append to the thread without a full page reload.
- Update unread counts in the All Chats list in real time.

### Step 13.4 — Create Chat flow

- Trigger: **Create Chat** button on All Chats screen.
- `<Dialog>` with fields: participant selector (`<Combobox>` with user search), category (`<Select>`).
- Server Action: insert `chat` and `chat_participants` rows for all selected users + current user.

### Step 13.5 — Auto-create Support Chat

- Trigger: called from the **Set Password** Server Action (Phase 3, Step 3.2) after first login is complete.
- Server Action (using service role key): fetch all users with `role = 'admin'` → create a `chat` with `category = 'support'` → insert `chat_participants` for the new user + all admins.

### Step 13.6 — Auto-create Sales Chat

- Trigger: called from the **Create Orders** Server Action (Phase 8, Step 8.2) when the client's order count goes from 0 to 1.
- Server Action: fetch all users with `role = 'manager'` → create a `chat` with `category = 'sales'` → insert `chat_participants` for the client + all managers.
- Only create this chat once per client. Check if a `sales` chat already exists for the client before creating.

---

## Phase 14 — QA & Hardening

### Step 14.1 — Audit RLS policies

- For each table, verify that every policy correctly restricts access by role and ownership.
- Test each policy by connecting to Supabase with a JWT from each role and attempting reads/writes that should be denied.

### Step 14.2 — Audit status transition guards

- Ensure no Server Action allows an illegal status transition (e.g., `new` → `content_approved`).
- Add a shared `assertOrderStatus(order, allowedStatuses[])` utility used in every order-related Server Action.

### Step 14.3 — Audit route protection

- Verify that middleware correctly blocks unauthenticated access to all `/dashboard/*` routes.
- Verify that each role cannot access another role's dashboard routes (e.g., a client cannot access `/dashboard/manager/*`).

### Step 14.4 — Form validation review

- Ensure every form has `zod` schema validation on both client (for UX) and server (for security).
- Ensure all Server Actions re-validate input even if the client already validated.

### Step 14.5 — Error handling

- All Server Actions return a typed result: `{ success: true, data } | { success: false, error: string }`.
- All pages handle loading states with `<Skeleton>`.
- All empty states show `<EmptyState>` with a helpful message.
- All errors surface via shadcn/ui `<Sonner>` toasts.

### Step 14.6 — Responsive layout review

- Test sidebar collapse on smaller screens using shadcn/ui `<Sidebar>` mobile mode.
- Ensure all `<DataTable>` components scroll horizontally on small screens.

---

## Appendix — Implementation Order Summary

```
Phase 1  → Foundation (Next.js, shadcn/ui, Supabase connection, types)
Phase 2  → Database (tables, triggers, RLS)
Phase 3  → Authentication (login, set password, forgot/reset password)
Phase 4  → Shell (layout, sidebar, shared components)
Phase 5  → User Management
Phase 6  → Profile
Phase 7  → Sites
Phase 8  → Client: Cart & Orders
Phase 9  → Manager/Admin: Order Management
Phase 10 → Copywriter
Phase 11 → Invoices
Phase 12 → Earnings
Phase 13 → Chat
Phase 14 → QA & Hardening
```

> **Recommended checkpoints:** After Phase 4, you should be able to log in and navigate the shell. After Phase 9, the core order workflow is end-to-end functional. Phases 11–13 add financial and communication layers on top of a working order system.