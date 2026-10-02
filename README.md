# EA Action Tracker

Private team workspaces for executive assistants to capture meeting commitments, rank follow-ups, and track department accountability.

## Core workflow

Sign in with a verified email. Create a workspace or accept an email-bound invite code. Create a Finance meeting, add actions with priorities and deadlines, and return to the ranked board. Red overdue and amber due-this-week flags identify who to chase first. Update status and notes; changes persist across devices.

Owners and admins see the whole workspace. Department editors can manage only their assigned department's meetings and actions; viewers can read only that department. Database RLS enforces tenant and department isolation even on direct API requests. Team management supports role/department assignment, expiring invite codes, revocation, and member removal. See docs/TEAM_WORKSPACES.md.

## Development

1. Link the existing Vercel project and run `vercel env pull .env.local`.
2. Run `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:tenancy`, and `pnpm build`.
3. Run `pnpm dev`. Configure Supabase Auth Site URL for your production domain and exact `/auth/callback` redirect URLs for production and localhost. Configure custom SMTP for ordinary team signup confirmation emails.
4. Apply migrations once in order. Never rerun 0001 seed SQL on an existing database. The team migration 0002 preserves legacy data as an archived read-only demo and creates private workspaces with five departments.

Deploy through Git pushes to main, never `vercel deploy`. Public Supabase URL/anon key belong in app environment; privileged administration keys never do. The optional scripts/verify-live-tenancy.mjs test requires an explicitly supplied local test admin key and fixture path, uses disposable accounts/workspaces, and cleans them with --cleanup. It never sends invite emails or alters existing user records.

Next.js 15, React 19, TypeScript, Tailwind and Supabase. Dates use Asia/Kuala_Lumpur. Read all docs before modifying the app. See docs/BUILD_LOG.md for verification status.
