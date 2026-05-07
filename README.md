# Linkbuilding Management System

A web-based internal platform that unifies all linkbuilding operations — from site selection and order creation through content writing, publication, and billing. It replaces spreadsheets and messaging tools with a single structured, role-based workflow.

## Roles

- **Client** — browses the site catalog, places orders, tracks progress
- **Manager** — manages clients, approves orders, oversees the full pipeline
- **Copywriter** — receives writing tasks, submits content
- **Sourcer** — manages the site catalog
- **Admin** — full access to all data and users

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth, Postgres, RLS, Realtime)
- **shadcn/ui** + Tailwind CSS v4
- **react-hook-form** + Zod

## Environments

| Environment | URL |
|---|---|
| Local | http://localhost:3000 |
| Staging | https://staging-link-building-five.vercel.app/ |
| Production | https://link-building-five.vercel.app/ |

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=        # optional, defaults to "Linkbuilding"
BREVO_SMTP_USER=          # Brevo SMTP login (used by Supabase local auth)
BREVO_SMTP_PASS=          # Brevo SMTP password / API key for SMTP relay
VERCEL_URL=               # set automatically on Vercel; falls back to http://localhost:3000
```

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
npm run dev           # start dev server
npm run build         # production build + TypeScript check
npm run lint          # run ESLint
npx tsc --noEmit      # typecheck without building
npm run link:prod     # link Supabase CLI to the production project
npm run link:staging  # link Supabase CLI to the staging project
npm run push:prod     # link + push migrations to production
npm run push:staging  # link + push migrations to staging
```

## Local Development with Supabase

The project includes a `supabase/config.toml` configured for local use with a real SMTP relay (Brevo).

1. Install the Supabase CLI (if not already):

```bash
brew install supabase/tap/supabase
```

2. Start local Supabase services:

```bash
supabase start
```

This spins up Postgres, Auth, Storage, and Studio at the ports defined in `config.toml` (API: 54321, DB: 54322, Studio: 54323).

3. Set the local env vars in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key printed by supabase start>
SUPABASE_SECRET_KEY=<service_role key printed by supabase start>
BREVO_SMTP_USER=          # required for local auth emails via Brevo SMTP relay
BREVO_SMTP_PASS=
```

4. Apply migrations:

```bash
supabase db reset
```

5. Stop services when done:

```bash
supabase stop
```
