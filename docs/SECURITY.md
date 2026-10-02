# EA Action Tracker — Security

## Secret handling
- Supabase URL + anon key: public (safe for client with RLS)
- Supabase service role key: server-only, never in frontend env
- Email provider key (later): server-only, in Vercel env vars
- No secrets committed to repo

## Permission model
- **v1 (demo):** permissive RLS — all tables readable/writable without login. Demo-first.
- **Lock-down (later sprint):** `auth.uid() = user_id` on all tables. Roles: EA (all access), CEO (read all), HOD (read own department + update own item status). Enforced via RLS policies, not app code.
- Agent (later) inherits EA permissions; never service-role for user actions.

## Approved-tools rule
- Only named server actions callable. No raw SQL execution or arbitrary function calls from the client.
- AI tools (later) are whitelisted functions in `lib/ai/`, not open-ended prompts.

## Audit principle
Every status change and deadline update writes a row to `audit_logs` (later). Deletions are human-only and logged. Truth lives in Postgres — survives refresh, identical on every device.