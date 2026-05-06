# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build (also runs TypeScript check)
npm run lint      # run ESLint
npx tsc --noEmit  # typecheck without building
```

No test suite is configured yet.

## Architecture

This is a linkbuilding management platform with five roles: `client`, `manager`, `copywriter`, `sourcer`, `admin`. Each role has its own dashboard route and sees different modules. See `PRD.md` for full feature spec and `PLAN.md` for the phased implementation plan.

### Key conventions

- **Next.js 16 App Router** — middleware is `src/proxy.ts` (not `middleware.ts`), exported as `proxy` (not `default` or `middleware`).
- **Supabase Auth + RLS** — never rely solely on frontend guards. All access rules must be mirrored in Supabase RLS policies.
- **Server Actions / Route Handlers** — all data fetching and mutations go server-side. No client-side Supabase queries except for Realtime subscriptions.
- **shadcn/ui** — use existing components in `src/components/ui/` before building custom ones. Style via `shadcn/tailwind.css` CSS variables (Tailwind v4, `@theme inline` in `globals.css`).
- **Forms** — `react-hook-form` + `zod` for all forms. Validate on both client and server.

### Supabase client usage

| Context | Import |
|---|---|
| Browser / Client Component | `src/lib/supabase/client.ts` → `createClient()` |
| Server Component / Server Action / Route Handler | `src/lib/supabase/server.ts` → `await createClient()` |
| Proxy (`proxy.ts`) | `src/lib/supabase/middleware.ts` → `updateSession()` |

The secret key (`SUPABASE_SECRET_KEY`) is for admin operations only — never expose it to the browser.

### Route structure (planned)

```
/login                          # auth
/auth/set-password
/auth/forgot-password
/auth/reset-password
/dashboard/client/*
/dashboard/manager/*
/dashboard/copywriter/*
/dashboard/sourcer/*
/dashboard/admin/*
```

The proxy redirects unauthenticated users from `/dashboard/*` → `/login`, and authenticated users from `/login` → `/dashboard/[role]`. Role is read from `user.user_metadata.role`.

### Types

All shared types are in `src/types/index.ts` — enums (`Role`, `OrderStatus`, etc.) and entity types (`User`, `Order`, etc.) derived from the database schema. Once the Supabase project is connected, generated types will live in `src/types/database.types.ts` and should be used for all DB interactions.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  # public key (replaces legacy anon key)
SUPABASE_SECRET_KEY             # server-only, admin operations (replaces legacy service_role key)
BREVO_API_KEY                   # server-only, used to send resend-invite emails via Brevo REST API
BREVO_SENDER_EMAIL              # verified sender email address in Brevo
BREVO_SENDER_NAME               # sender display name (optional, defaults to "Linkbuilding")
VERCEL_URL                      # set automatically on Vercel; used to build email redirect URLs. Falls back to http://localhost:3000.
```
