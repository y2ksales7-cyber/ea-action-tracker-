# EA Action Tracker

A Supabase-backed demo workspace for executive assistants to capture meeting commitments, rank follow-ups, and track department accountability.

## Core workflow

Open the board, choose New Meeting, select Finance and save a topic/date. Add action items with assignees, priorities and deadlines. Return to the board: active commitments are ranked by priority then deadline, with red overdue and amber due-this-week flags. Expand an item to update status and notes or edit/delete it. Switch to Status groups for Overdue, Open, In Progress and Done lanes. Departments and Reports show live counts.

## Development and verification

1. Sign in to Vercel, link to the existing project, then run `vercel env pull .env.local`.
2. Run `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build`.
3. Run `node --env-file=.env.local scripts/verify-db.mjs` to check the existing tables and five departments. Add `--crud` to verify anonymous writes with temporary records cleaned up afterward.
4. Run `pnpm dev` and perform the browser scenario in `docs/TEST_PLAN.md`.

Do not rerun the seed migration against an existing schema: its seed inserts are not idempotent. If tables are absent, apply `supabase/migrations/0001_init.sql` once through the provisioned Supabase project's SQL editor or an authorized Postgres connection. Deploy with Git pushes to main; do not deploy local files with the Vercel CLI. See `docs/BUILD_LOG.md` for actual verification status.

## v1 scope

Next.js 15, React 19, TypeScript, Tailwind and Supabase. Dates use Asia/Kuala_Lumpur. The v1 workspace is public and editable; use demo data. Auth/owner-scoped RLS and AI are later sprints, intentionally absent from v1. Read all documents in `/docs` before modifying the app.
