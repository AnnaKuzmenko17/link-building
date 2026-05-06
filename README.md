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
VERCEL_URL=               # set automatically on Vercel; falls back to http://localhost:3000
```

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build + TypeScript check
npm run lint      # run ESLint
npx tsc --noEmit  # typecheck without building
```
