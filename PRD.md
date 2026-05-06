# PRD: Linkbuilding Management System

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Roles & Permissions](#3-roles--permissions)
4. [Database Schema](#4-database-schema)
5. [Modules](#5-modules)
   - [5.1 Authentication](#51-authentication)
   - [5.2 User Management](#52-user-management)
   - [5.3 Profile](#53-profile)
   - [5.4 Sites](#54-sites)
   - [5.5 Client Orders](#55-client-orders)
   - [5.6 Order Management](#56-order-management)
   - [5.7 Copywriting](#57-copywriting)
   - [5.8 Invoices](#58-invoices)
   - [5.9 Earnings](#59-earnings)
   - [5.10 Chat](#510-chat)
6. [UI/UX Guidelines](#6-uiux-guidelines)
7. [Global Business Rules](#7-global-business-rules)

---

## 1. Project Overview

A web-based internal platform that unifies all linkbuilding operations — from site selection and order creation through content writing, publication, and billing. It replaces spreadsheets and messaging tools with a single structured, role-based workflow.

**Core goals:**
- Reduce manual operations and eliminate process chaos
- Enable client self-service
- Reduce manager dependency through structured workflows
- Support scalable growth without proportional hiring

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Database & Auth | Supabase (PostgreSQL + Supabase Auth) |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS (via shadcn/ui) |

### Key conventions

- Use **Supabase Auth** for all authentication flows (sessions, tokens, password reset, invite emails).
- Use **Supabase Row Level Security (RLS)** to enforce per-role data access at the database level — do not rely solely on frontend route guards.
- All server-side data fetching and mutations go through **Next.js Server Actions** or **Route Handlers**.
- Use **shadcn/ui** components as the base for all UI elements. Do not build custom primitives when a shadcn/ui component exists.

---

## 3. Roles & Permissions

Five roles exist in the system. Each role sees a different dashboard and has access to different modules.

| Role | Description |
|---|---|
| `client` | Places orders, approves content, views invoices |
| `manager` | Coordinates orders, assigns copywriters, manages publication |
| `copywriter` | Writes and submits content for assigned orders |
| `sourcer` | Adds websites to the site catalog, earns commission |
| `admin` | Full system access: approves sites, manages users and finances |

---

## 4. Database Schema

> High-level entities and relationships. Implement as Supabase (PostgreSQL) tables with RLS policies per role.

### Entities

**users**
- Extends Supabase `auth.users`
- Fields: `id`, `email`, `role` (enum), `status` (enum: `pending` | `active` | `disabled`), `first_name`, `last_name`, `manager_id` → users (nullable, only relevant for `client` role), `created_at`
- `manager_id` points to the manager assigned to this client. Null for all non-client roles.

**sites**
- Fields: `id`, `url`, `sourcer_id` → users, `status` (enum: `pending` | `active` | `archived`), `created_at`, `updated_at`
- A site is always owned by one sourcer. When a sourcer is disabled, `sourcer_id` is set to `null`.

**cart_items**
- Fields: `id`, `client_id` → users, `site_id` → sites, `created_at`
- Temporary holding area before order creation. Deleted when orders are created.

**orders**
- Fields: `id`, `client_id` → users, `site_id` → sites, `copywriter_id` → users (nullable), `sourcer_id` → users (derived from site at order time), `chat_id` → chats (nullable), `status` (enum — see below), `publish_month`, `content` (text, nullable), `published_url` (nullable), `created_at`, `updated_at`
- Order status enum: `new` | `in_progress` | `content_sent` | `needs_changes` | `content_approved` | `published` | `completed` | `canceled`
- `chat_id` is set when a user clicks **Start Chat** on the order; reused on subsequent clicks.

**change_requests**
- Fields: `id`, `order_id` → orders, `comment` (text), `created_by` → users, `created_at`
- Created when a client rejects content.

**invoices**
- Fields: `id`, `client_id` → users, `status` (enum: `draft` | `sent` | `paid`), `billing_period_start`, `billing_period_end`, `created_at`, `updated_at`
- One invoice per client per billing period. Created automatically by system job.

**invoice_items**
- Fields: `id`, `invoice_id` → invoices, `order_id` → orders, `amount`

**chats**
- Fields: `id`, `created_by` → users, `category` (enum: `support` | `sales` | `general`), `title` (text), `status` (enum: `active` | `archived`, default `active`), `created_at`
- `general` is displayed in the UI as **Standard**.
- `title` is required. Default value when auto-generated: comma-joined participant names. For order-linked chats: the order's site `domain`.

**chat_participants**
- Fields: `id`, `chat_id` → chats, `user_id` → users

**messages**
- Fields: `id`, `chat_id` → chats, `sender_id` → users, `body` (text), `read_by` (uuid[], default `{}`), `created_at`
- `read_by` stores the ids of users who have viewed the message. A message is "unread" for a given user if their id is not in `read_by` and they are not the sender.

### Key Relationships

```
users (manager) ──< users (client, via manager_id)
users ──< orders >── sites
orders ──< change_requests
orders ──> chats (optional, via chat_id)
users ──< invoices ──< invoice_items >── orders
chats >──< users (via chat_participants)
chats ──< messages
```

---

## 5. Modules

---

### 5.1 Authentication

**Screens:** Login, Set Password (first login), Forgot Password, Reset Password

#### 5.1.1 First Login

1. User receives an invitation email with a temporary password.
2. User enters email + temporary password on the Login screen.
3. System validates credentials and detects that it is a first login.
4. System redirects user to the **Set Password** screen.
5. User enters and confirms a new password, clicks **Save**.
6. System validates the token, saves the new password, sets user `status` to `active`, and redirects to the role-appropriate dashboard.

#### 5.1.2 Standard Login

1. User enters email and password.
2. System verifies credentials via Supabase Auth.
3. On success, redirects to the role-appropriate dashboard.
4. On failure (user not found, wrong password, or disabled account), display an error message and remain on the Login screen.

> Do not specify whether the user does not exist or the password is incorrect — use a generic error to prevent user enumeration.

#### 5.1.3 Forgot Password

1. User clicks **Forgot password** on the Login screen.
2. System redirects to the **Forgot Password** screen.
3. User enters their email and clicks **Send reset link**.
4. If email exists: system generates a Supabase password reset token and sends the reset email. Display message: *"Check your email for a reset link."*
5. If email does not exist: display message: *"No account found with that email."*
6. User can navigate back to Login at any time.

#### 5.1.4 Reset Password

1. User clicks the reset link in the email and is directed to the **Reset Password** screen.
2. User enters and confirms a new password, clicks **Save**.
3. System validates the reset token (via Supabase) and updates the password.
4. System displays a success message with a link to return to Login.

---

### 5.2 User Management

**Screens:** All Users, User Details, Invite User, Resend Invite, Edit User, Confirm Status Change, Reassign Orders

#### Permission Matrix

| Action | manager | admin |
|---|---|---|
| View (all roles) | ✅ | ✅ |
| Invite | `client`, `copywriter`, `sourcer` only | All roles |
| Resend invite | `client`, `copywriter`, `sourcer` only | All roles |
| Edit | `client`, `copywriter`, `sourcer` only | All roles |
| Change status | ❌ | ✅ |
| Assign manager to client | ❌ | ✅ |

#### 5.2.1 View Users

- Display a paginated list of all users on the **All Users** screen.
- Clicking a user opens the **User Details** screen.

#### 5.2.2 Filter Users

- Filter by: role, status, name/email search.

#### 5.2.3 Invite User

1. User clicks **Invite User**.
2. System displays the **Invite User** screen.
3. User enters email and selects a role, clicks **Send Invite**.
4. System validates email uniqueness.
5. On success: creates a user record with `status = pending`, generates an invitation token via Supabase Auth, sends the invitation email.
6. On duplicate email: display an error.

**Manager auto-assignment rule:** When the inviting user has role `manager` and the invited role is `client`, the system automatically sets `manager_id` on the new client record to the inviting manager's `id`. No manual selection is needed.

**Admin inviting a client:** The invite form shows an additional **Assign Manager** field — a `<Select>` listing all active managers. The admin must select a manager before sending the invite. `manager_id` is set to the selected manager.

#### 5.2.4 Resend Invite

- Only available for users with `status = pending`.
- Clicking **Resend Invite** shows a confirmation screen.
- On confirm: resend the invitation email.

#### 5.2.5 Edit User

- Opens the **Edit User** screen with pre-filled form.
- On save: system updates user data.
- Editable fields: first name, last name, email (validate uniqueness), role.

#### 5.2.6 Assign Manager to Client

- Available only to `admin`. Shown on the **User Details** screen for any user with `role = client`.
- Admin clicks **Assign Manager** → `<Select>` listing all active managers, pre-selected with the current `manager_id` if one exists.
- On save: system updates `manager_id` on the client record.
- If the client has an existing **Sales Chat**, add the new manager as a participant and remove the old manager if they are no longer assigned to any client in that chat. (Simpler alternative: leave the old manager in the chat and just add the new one.)

#### 5.2.6 Change User Status

**Deactivate — standard (no active orders):**
1. Click **Disable** → show confirmation dialog.
2. On confirm: set `status = disabled`.

**Deactivate — copywriter with active orders:**
1. Click **Disable** → show **Reassign Orders** screen.
2. User selects a replacement copywriter for each active order.
3. On save: reassign orders and set `status = disabled`.

**Deactivate — sourcer:**
1. Click **Disable** → show confirmation dialog.
2. On confirm: set `status = disabled` and set `sourcer_id = null` on all sites owned by this sourcer.

**Deactivate — current user:**
- Action is forbidden. Do not show the Disable button for the currently authenticated user.

**Activate:**
1. Click **Activate** → show confirmation dialog.
2. On confirm: set `status = active`.

---

### 5.3 Profile

**Screens:** View Profile, Edit Profile, Change Password

**Rule:** Users can only access their own profile.

#### 5.3.1 View Profile

- Displays current user's name, email, role, and status.

#### 5.3.2 Edit Profile

1. Click **Edit**.
2. System displays the **Edit Profile** form.
3. User updates fields, clicks **Save**.
4. System saves changes.

#### 5.3.3 Change Password

1. System displays **Change Password** form (current password, new password, confirm new password).
2. On submit: validate current password is correct, validate new passwords match.
3. On success: save new password via Supabase Auth.

---

### 5.4 Sites

**Screens:** All Sites, View Site, Create Site, Edit Site, Change Status, All Categories, Create Category, Edit Category

#### Permission Matrix

| Action | sourcer | manager | admin |
|---|---|---|---|
| View | Own sites + status ≠ `archived` | All | All |
| Filter | Own sites + status ≠ `archived` | All | All |
| Create | ✅ | ❌ | ❌ |
| Edit | Own sites + status ≠ `archived` | ❌ | ✅ all |
| Change status | ❌ | ❌ | ✅ |
| Add to Cart | ❌ | ❌ | ❌ (client only) |
| Manage Categories | ❌ | ❌ | ✅ |

---

#### Entities

**Site**

| Field | Type | Validation | Notes |
|---|---|---|---|
| `id` | string | required, unique | |
| `created_at` | date | required | |
| `created_by` | → users | required | |
| `sourcer_id` | → users | optional | Set to `null` when sourcer is disabled |
| `domain` | string | required, unique, URL format | e.g. `name.com` |
| `dr` | number | required | Domain rating |
| `category_id` | → categories | required | |
| `top_countries` | string | required | |
| `countries` | Country[] | required, min 1 | |
| `languages` | Language[] | required, min 1 | |
| `price` | number | required | USD, 1 = $1 |
| `status` | SiteStatus | required | |
| `requirements` | string | optional | Site content requirements |
| `description` | string | optional | |
| `sourcer_notes` | string | optional | |
| `contact_info` | string | optional | Site communication info |
| `link_type` | LinkType | required | Default: `dofollow` |
| `keywords_relevance` | string | optional | |
| `organic_keywords_count` | number | required | Default: `0` |
| `organic_traffic_count` | number | required | Default: `0` |
| `needs_changes_by` | → users | conditional | Required if `status = needs_changes` |
| `needs_changes_at` | date | conditional | Required if `status = needs_changes` |
| `approved_by` | → users | conditional | Required if `status = active` |
| `approved_at` | date | conditional | Required if `status = active` |

**Category**

| Field | Type | Validation |
|---|---|---|
| `id` | string | required, unique |
| `created_at` | date | required |
| `created_by` | → users | required |
| `name` | string | required, unique |

**Enums**

`SiteStatus`: `pending` | `active` | `needs_changes` | `archived`

`LinkType`: `dofollow` | `nofollow` | `sponsored` | `ugc`

`Country`: `Ukraine` | `Germany` | `Poland` | `USA` | `UK` | `France` | `Spain` | `Italy` | `Netherlands` | `Czech Republic`

`Language`: `English` | `German` | `Spanish` | `Portuguese` | `French`

---

#### 5.4.1 All Sites screen

Displays a paginated list of sites within the user's permission scope.

**Columns visible to all roles with access:** Domain, DR, Category, Top Countries, Countries, Languages, Price, Status.

**Status column** is visible to `sourcer` and `admin` only.

**Action buttons per row:**

| Button | Visible when |
|---|---|
| **Create** | `user.role = sourcer` (header-level button, not per-row) |
| **Add to Cart** | `user.role = client` |
| **Edit** | `user.role = admin` OR (`user.role = sourcer` AND `site.created_by = user.id` AND `site.status ≠ archived`) |
| **Request Changes** | `user.role = admin` AND `site.status = pending` |
| **Approve** | `user.role = admin` AND `site.status IN (pending, needs_changes)` |
| **Archive** | `user.role = admin` AND `site.status ≠ archived` |
| **Unarchive** | `user.role = admin` AND `site.status = archived` |

---

#### 5.4.2 Filter Sites

| Field | Type | Notes |
|---|---|---|
| Search | string | Searches across: domain, keywords relevance, description |
| Category | Category | |
| Status | SiteStatus | |
| Countries | Country[] | |
| Language | Language | |
| Link type | LinkType | |
| Price from | number | |
| Price to | number | |

---

#### 5.4.3 View Site screen

**Fields visible to all roles with access:**

Domain, DR, Category, Top Countries, Countries, Languages, Price.

**Conditionally visible fields:**

| Field | Visible to | Condition |
|---|---|---|
| Status | `sourcer`, `admin` | always |
| Needs Changes By | `admin` | only if `status = needs_changes` |
| Needs Changes At | `admin` | only if `status = needs_changes` |
| Approved By | `admin` | only if `status = active` |
| Approved At | `admin` | only if `status = active` |
| Requirements | `sourcer`, `manager`, `admin` | always |
| Description | `sourcer`, `manager`, `admin` | always |
| Sourcer Notes | `sourcer`, `admin` | always |
| Contact Info | `sourcer`, `manager`, `admin` | always |
| Link Type | all | always |
| Keywords Relevance | all | always |
| Organic Keywords Count | all | always |
| Organic Traffic Count | all | always |
| Created By | `admin` | always |

**Action buttons** follow the same visibility rules as the All Sites screen.

---

#### 5.4.4 Create Site

Available to `sourcer` only. The sourcer becomes `created_by` and `sourcer_id` on the new record. On save: `status` is set to `pending`.

| Field | Type | Validation |
|---|---|---|
| Domain | string | required, unique, URL format |
| DR | number | required |
| Category | Category | required |
| Top Countries | string | required |
| Countries | Country[] | required, min 1 |
| Languages | Language[] | required, min 1 |
| Price | number | required |
| Requirements | string | optional |
| Description | string | optional |
| Sourcer Notes | string | optional |
| Contact Info | string | optional |
| Link Type | LinkType | required, default `dofollow` |
| Keywords Relevance | string | optional |
| Organic Keywords Count | number | required, default `0` |
| Organic Traffic Count | number | required, default `0` |

---

#### 5.4.5 Edit Site

Available to `admin` (any site) and `sourcer` (own sites where `status ≠ archived`).

Same fields as Create Site. On save by sourcer: `status` is reset to `pending` so the site goes through admin re-approval.

> Show a notice to the user: *"Saving will reset this site to Pending for re-approval."*

---

#### 5.4.6 Change Status

Admin only. All status changes go through a confirmation dialog before the action is applied.

**Status transitions and side effects:**

| Action | Transition | Side effects |
|---|---|---|
| Request Changes | `pending` → `needs_changes` | Sets `needs_changes_by` and `needs_changes_at` |
| Approve | `pending` / `needs_changes` → `active` | Sets `approved_by` and `approved_at`. Clears `needs_changes_by` and `needs_changes_at` if previously set |
| Archive | any → `archived` | None |
| Unarchive | `archived` → `pending` | Clears `approved_by`, `approved_at`, `needs_changes_by`, `needs_changes_at` |

**Action button visibility per site status:**

| Current Status | Available Actions |
|---|---|
| `pending` | Request Changes, Approve, Archive |
| `needs_changes` | Approve, Archive |
| `active` | Archive |
| `archived` | Unarchive |

##### 5.4.6.1 Request Changes

1. Admin clicks **Request Changes** on a site with `status = pending`.
2. System displays a confirmation dialog.
3. Admin clicks **Confirm**.
4. System sets `status = needs_changes`, sets `needs_changes_by` to the current admin user, sets `needs_changes_at` to the current timestamp.

##### 5.4.6.2 Approve Site

1. Admin clicks **Approve** on a site with `status = pending` or `needs_changes`.
2. System displays a confirmation dialog.
3. Admin clicks **Confirm**.
4. System sets `status = active`, sets `approved_by` to the current admin user, sets `approved_at` to the current timestamp. If the site previously had `needs_changes_by` or `needs_changes_at` set, those fields are cleared.

##### 5.4.6.3 Archive Site

1. Admin clicks **Archive** on a site with any status except `archived`.
2. System displays a confirmation dialog.
3. Admin clicks **Confirm**.
4. System sets `status = archived`.

##### 5.4.6.4 Unarchive Site

1. Admin clicks **Unarchive** on a site with `status = archived`.
2. System displays a confirmation dialog.
3. Admin clicks **Confirm**.
4. System sets `status = pending` and clears `approved_by`, `approved_at`, `needs_changes_by`, `needs_changes_at`.

---

#### 5.4.7 All Categories screen

Admin only. Displays a list of all categories. Header-level **Create Category** button. **Edit** button per row.

#### 5.4.8 Create Category / Edit Category

Admin only. Single field: **Name** (required, unique). **Save** and **Cancel** buttons.

---

### 5.5 Client Orders

**Screens:** All Sites (client view), Cart, All Orders (client view), Review Content

**Rule:** This module is available only to users with role `client`.

#### 5.5.1 View & Filter Sites

- Client sees the site catalog (active sites only).
- Filter by available site attributes.

#### 5.5.2 Add Site to Cart

1. Client clicks **Add to Cart** on a site.
2. System creates a `cart_item` record linking the client to the site.

#### 5.5.3 Create Orders from Cart

1. Client opens the **Cart** screen.
2. For each cart item, client selects a **publish month**.
3. Client clicks **Create Order**.
4. System creates one `order` per cart item with `status = new`.
5. System deletes all cart items that were converted.

#### 5.5.4 Cancel Order

- Available for orders with `status = new`.
1. Client clicks **Cancel** → confirmation screen.
2. On confirm: set `status = canceled`.

#### 5.5.5 Edit Order

- Available for orders with `status = new`.
1. Client clicks **Edit** → **Edit Order** form.
2. On save: system updates order data.

#### 5.5.6 Review Content

**Approve:**
1. Client clicks **Review** on an order with `status = content_sent`.
2. System displays **Review Content** screen with the submitted content.
3. Client clicks **Approve**.
4. System sets `status = content_approved`.

**Request Changes:**
1. Client clicks **Needs Changes**.
2. System displays **Leave Comment** form.
3. Client enters feedback and clicks **Send**.
4. System creates a `change_request` record, sets `status = needs_changes`.

---

### 5.6 Order Management

**Screens:** All Orders, View Order, Assign Copywriter, Reassign Copywriter, Publish Order

#### Permission Matrix

| Action | manager | admin |
|---|---|---|
| View & Filter | ✅ | ✅ |
| Assign / Reassign Copywriter | ✅ | ✅ |
| Publish Order | ✅ | ✅ |

#### 5.6.1 View Orders

- Paginated list of all orders.
- Clicking an order opens the **View Order** screen.

#### 5.6.2 Filter Orders

- Filter by: status, client, copywriter, site, publish month.

#### 5.6.3 Assign Copywriter

- Available when no copywriter is assigned.
1. User clicks **Assign Copywriter** → **Assign Copywriter** form.
2. User selects a copywriter and clicks **Save**.
3. System saves data, sets `status = in_progress`, assigns `copywriter_id`.

#### 5.6.4 Reassign Copywriter

- Available when a copywriter is already assigned.
1. User clicks **Reassign Copywriter** → form.
2. User selects a new copywriter and clicks **Save**.
3. System updates `copywriter_id`. Status remains unchanged.

#### 5.6.5 Publish Order

- Available for orders with `status = content_approved`.
1. User clicks **Publish** → **Publish Order** form.
2. User enters the publication URL and clicks **Publish**.
3. System validates the URL format, saves `published_url`, sets `status = published`.

---

### 5.7 Copywriting

**Screens:** All Orders (copywriter view), Create Content, Edit Content

**Rule:** Available only to users with role `copywriter`. Users see only their assigned orders.

#### 5.7.1 Write Content

- Available for orders with `status = in_progress`.
1. Copywriter clicks **Create Content** → **Create Content** form.
2. Copywriter fills in the content and clicks **Save**.
3. System saves the content (draft, does not change status yet).

#### 5.7.2 Edit Content

- Available for orders with `status = needs_changes`.
1. Copywriter clicks **Edit Content** → **Edit Content** form with existing content and change request comments visible.
2. Copywriter updates the content and clicks **Save**.
3. System saves the updated content.

#### 5.7.3 Submit Content

- Available from the **View Order** screen when content has been saved.
1. Copywriter clicks **Submit**.
2. System sets `status = content_sent`.

---

### 5.8 Invoices

**Screens:** All Invoices, View Invoice, Edit Invoice, Confirm Send, Confirm Mark as Paid

#### Permission Matrix

| Action | client | manager | admin | system |
|---|---|---|---|---|
| View | Own, status = `sent` or `paid` | All | All | — |
| Filter | Own, status = `sent` or `paid` | All | All | — |
| Create | ❌ | ❌ | ❌ | ✅ (auto) |
| Edit | ❌ | ✅ (`draft` only) | ✅ (`draft` only) | — |
| Send Invoice | ❌ | ✅ | ✅ | — |
| Mark as Paid | ❌ | ✅ | ✅ | — |
| Download PDF | Own, status = `sent` or `paid` | ✅ | ✅ | — |

#### 5.8.1 Automatic Invoice Creation

- A scheduled system job runs monthly.
- The job finds all orders with `status = published` for each client.
- For each client, the system creates one invoice for the billing period and sets `status = draft`.
- Invoice items are created for each qualifying order.

> Note: The actual publication date of an order may fall outside the invoice billing period, because managers can adjust publication dates before sending the invoice to the client.

#### 5.8.2 View Invoices

- Paginated list of invoices within the user's permission scope.
- Clicking an invoice opens the **View Invoice** screen.

#### 5.8.3 Filter Invoices

- Filter by: status, client (manager/admin), billing period.

#### 5.8.4 Edit Invoice

- Available for invoices with `status = draft`.
1. User clicks **Edit** → **Edit Invoice** form.
2. User updates invoice fields (e.g., adjusts publication dates or amounts).
3. On save: system saves changes.

#### 5.8.5 Send Invoice

1. User clicks **Send Invoice** → confirmation screen.
2. On confirm: set `status = sent`.

#### 5.8.6 Mark as Paid

1. User clicks **Mark as Paid** → confirmation screen.
2. On confirm: set invoice `status = paid` and set all associated orders `status = completed`.

#### 5.8.7 Download PDF

1. User clicks **Download**.
2. System generates a PDF of the invoice and triggers a file download.

---

### 5.9 Earnings

**Screens:** Earnings

#### Permission Matrix

| Action | sourcer | manager | admin |
|---|---|---|---|
| View | Own (where `order.sourcer_id = user.id`) | All | All |
| Filter | Own | All | All |

#### 5.9.1 View Earnings

- Displays a summary of earnings calculated from completed orders linked to the sourcer.

#### 5.9.2 Filter Earnings

- Filter by: date range, site, status.

---

### 5.10 Chat

**Screens:** All Chats, Chat (thread view), Create Chat, Edit Chat, Change Chat Status

> **Categories:** `support` | `sales` | `general`. The UI label for `general` is **Standard**.
> **Status:** `active` | `archived` (default `active`). Archived chats are read-only.

#### Permission Matrix

All roles (`client`, `sourcer`, `copywriter`, `manager`, `admin`) have the same chat capabilities. Access is gated by participation, not by role.

| Action | All roles |
|---|---|
| View own chats | ✅ |
| Filter | ✅ |
| Create (Standard only) | ✅ |
| Send message (Active chats only) | ✅ |
| Edit (Standard only) | ✅ (any participant) |
| Archive / Unarchive (Standard only) | ✅ (any participant) |
| Start Chat from Order | ✅ |

> Edit, Archive, and Unarchive are **forbidden** on Support and Sales chats.

#### 5.10.1 View Chats

- **All Chats** screen shows chats the user participates in, sorted by most recent message activity.
- Each row shows: title, category badge, status badge (when `archived`), last message preview, unread count.
- Clicking a chat opens the **Chat** screen (thread view).
- When a user opens a thread, the system appends their `auth.uid()` to `read_by` for every message in the chat where it is not already present and where they are not the sender.

#### 5.10.2 Filter Chats

- Filter by: category, status (Active / Archived), participant name, keyword search across title and message bodies.

#### 5.10.3 Create Chat (manual)

1. User clicks **Create Chat** → **Create Chat** form.
2. Form fields:
   - **Users**: required, multi-select; must include at least 2 users (the creator + at least one other). The creator is added automatically.
   - **Title**: required. Default value: comma-joined participant names; the user can override.
3. User clicks **Create**.
4. System creates the chat with `category = general`, `status = active`, `created_by = auth.uid()`, and adds all selected participants.

> Users cannot manually create `support` or `sales` chats — those categories are reserved for system auto-creation.

#### 5.10.4 Auto-create Support Chat

- **Trigger:** a new user sets their password for the first time (completes first login).
- System automatically creates a chat between the new user and all active users with role `admin`.
- `category = support`, `status = active`. Title defaults to `"Support"`.

#### 5.10.5 Auto-create Sales Chat

- **Trigger:** a new user with role `client` sets their password for the first time (completes first login).
- System automatically creates a chat between the client and the **single manager assigned to that client** (`users.manager_id`). No other managers are added.
- `category = sales`, `status = active`. Title defaults to `"Sales"`.
- If the client's `manager_id` is later reassigned, the old manager remains in the chat and the new manager is added (see §5.2.6 Assign Manager to Client).

#### 5.10.6 Edit Chat

- Available only for chats with `category = general`. Forbidden for `support` and `sales`.
- Available to any participant of the chat.
1. User clicks **Edit** on the All Chats row or in the Chat header.
2. System displays the **Edit Chat** form with current title and participants pre-filled.
3. User updates fields and clicks **Save**. Validation: at least 2 users.
4. System saves the changes.

#### 5.10.7 Archive / Unarchive Chat

- Available only for chats with `category = general`. Forbidden for `support` and `sales`.
- Available to any participant.

**Archive:**
1. User clicks **Archive** on a chat with `status = active`.
2. System displays the **Change Chat Status** confirmation screen with a read-only disclaimer.
3. User clicks **Confirm**. System sets `status = archived`.

**Unarchive:**
1. User clicks **Unarchive** on a chat with `status = archived`.
2. System displays the confirmation screen.
3. User clicks **Confirm**. System sets `status = active`.

#### 5.10.8 Start Chat from Order

- Available on the **View Order** screen via a **Start Chat** button (visible to all roles with order access).
1. User clicks **Start Chat**.
2. **If `order.chat_id` is set:** system navigates the user to that chat.
3. **If `order.chat_id` is null:** system creates a new chat with:
   - `category = general`, `status = active`, `created_by = auth.uid()`
   - `title` = the order's site `domain`
   - Participants: the current user, the order's `copywriter_id` (if assigned), and the client's `manager_id` (if set). Duplicates are deduplicated. The client itself is *not* added unless they are the current user.
4. System sets `order.chat_id` to the new chat id and navigates the user to the chat.

#### 5.10.9 Send Message

- Available only for chats with `status = active`. Archived chats display the thread read-only with no input.
1. User types a message in the input field and clicks **Send**.
2. System creates a `message` record with `read_by = []` (the sender is implicitly considered "read" — they are excluded from unread calculations for their own messages).
3. Message appears in the thread immediately.

---

## 6. UI/UX Guidelines

### Component Library

Use **shadcn/ui** for all UI primitives. Do not build custom components when a shadcn/ui equivalent exists.

| UI Pattern | shadcn/ui Component |
|---|---|
| Data tables (users, orders, sites, invoices) | `<DataTable>` with `@tanstack/react-table` |
| Forms (invite, edit, create) | `<Form>` with `react-hook-form` + `zod` |
| Confirmation dialogs (disable, archive, send) | `<AlertDialog>` |
| Modals / side panels | `<Dialog>` or `<Sheet>` |
| Status indicators | `<Badge>` with variant per status |
| Notifications / toasts | `<Sonner>` (toast) |
| Filters / dropdowns | `<Select>`, `<Combobox>` |
| Navigation | `<Sidebar>` (role-based items) |
| Loading states | `<Skeleton>` |
| Pagination | Custom using shadcn/ui `<Button>` + server-side pagination |

### Status Color Convention

Apply consistent color-coding to `<Badge>` across all modules:

| Status | Badge Variant / Color |
|---|---|
| `pending` | `outline` (yellow) |
| `active` | `default` (green) |
| `disabled` | `secondary` (gray) |
| `new` | `outline` (blue) |
| `in_progress` | `default` (blue) |
| `content_sent` | `default` (purple) |
| `needs_changes` | `destructive` (red) |
| `content_approved` | `default` (green) |
| `published` | `default` (teal) |
| `completed` | `secondary` (gray-green) |
| `canceled` | `destructive` (red) |
| `draft` | `outline` (gray) |
| `sent` | `default` (blue) |
| `paid` | `default` (green) |
| `archived` (site or chat) | `secondary` (gray) |
| Chat `active` | `default` (green) |

### Layout

- Use a persistent **left sidebar** (shadcn/ui `<Sidebar>`) with role-based navigation items.
- Each role sees only the modules they have access to.
- Use **Next.js App Router layouts** per role group (e.g., `/dashboard/client/`, `/dashboard/manager/`).
- Protect all routes with **Supabase session middleware** — unauthenticated users are redirected to `/login`.

### Forms

- All forms use **`react-hook-form`** + **`zod`** for validation, wired through shadcn/ui `<Form>`.
- Show inline field-level errors beneath each input.
- Disable the submit button while a request is in flight; show a loading spinner inside the button.

---

## 7. Global Business Rules

1. **User status gates access.** Users with `status = disabled` cannot log in.
2. **Editing a site resets its status to `pending`.** It must be re-approved by an admin before it is visible in the client catalog.
3. **Sourcer assignment is recorded at order creation.** Even if the sourcer is later disabled, the historical link on the order is preserved for earnings calculation.
4. **A disabled copywriter's orders must be reassigned before deactivation.**
5. **A disabled sourcer's sites have `sourcer_id` set to `null`.** The sites themselves are not archived.
6. **A user cannot deactivate themselves.**
7. **Invoices are created automatically by a system job, not manually.** Managers and admins can only edit, send, and mark them as paid.
8. **Invoice billing period and actual publication date may differ.** Managers can adjust publication dates on invoice items before sending.
9. **One invoice per client per billing period.** Multiple orders roll into one invoice.
10. **Support and Sales chats are auto-created on first login.** Both chats are created by the system the moment a user completes Set Password. Support chat includes the new user + all active admins. Sales chat (clients only) includes the client + their assigned manager only — never any other managers. Users cannot manually create chats with category `support` or `sales`; those are system-only. Archive/Edit are forbidden on Support and Sales chats.
11. **Order status transitions are strictly sequential.** No skipping statuses (e.g., cannot go from `new` directly to `content_approved`).
12. **RLS enforces data isolation.** Never rely solely on frontend guards — all access rules must be mirrored in Supabase RLS policies.
13. **Every client must have a manager assigned.** `manager_id` is required and must be set at invite time. A client cannot exist without a manager.
14. **Manager auto-assignment on invite.** When a manager invites a client, `manager_id` is set automatically to that manager's id. When an admin invites a client, the admin must explicitly select a manager — the invite form is invalid without one.
15. **Only admins can reassign a client's manager.** Managers cannot change their own assignment or another manager's clients.